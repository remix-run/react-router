import * as path from "node:path";
import * as stream from "node:stream";
import * as http from "node:http";
import * as https from "node:https";
import fs from "fs-extra";
import prettyMs from "pretty-ms";
import execa from "execa";
import express from "express";
import pc from "picocolors";
import exitHook from "exit-hook";

import * as Channel from "../channel";
import { type Manifest } from "../manifest";
import * as Compiler from "../compiler";
import { createFileWatchCache } from "../compiler/fileWatchCache";
import { type RemixConfig } from "../config";
import { loadEnv } from "./env";
import * as Socket from "./socket";
import * as HMR from "./hmr";
import { detectPackageManager } from "../cli/detectPackageManager";
import * as HDR from "./hdr";
import type { Result } from "../result";
import { err, ok } from "../result";
import invariant from "../invariant";
import { logger } from "../tux";
import { killtree } from "./proc";

let detectBin = async (): Promise<string> => {
  let pkgManager = detectPackageManager() ?? "npm";
  if (pkgManager === "npm") {
    // npm v9 removed the `bin` command, so have to use `prefix`
    let { stdout } = await execa(pkgManager, ["prefix"]);
    return path.join(stdout.trim(), "node_modules", ".bin");
  }
  if (pkgManager === "bun") {
    let { stdout } = await execa(pkgManager, ["pm", "bin"]);
    return stdout.trim();
  }
  let { stdout } = await execa(pkgManager, ["bin"]);
  return stdout.trim();
};

export let serve = async (
  initialConfig: RemixConfig,
  options: {
    command?: string;
    manual: boolean;
    port: number;
    tlsKey?: string;
    tlsCert?: string;
    REMIX_DEV_ORIGIN: URL;
  }
) => {
  await loadEnv(initialConfig.rootDirectory);
  let state: {
    appServer?: execa.ExecaChildProcess;
    manifest?: Manifest;
    prevManifest?: Manifest;
    appReady?: Channel.Type<void>;
    loaderChanges?: Promise<Result<Record<string, string>>>;
    prevLoaderHashes?: Record<string, string>;
  } = {};

  let app = express()
    // handle `broadcastDevReady` messages
    .use(express.json())
    .post("/ping", (req, res) => {
      let { buildHash } = req.body;
      if (typeof buildHash !== "string") {
        logger.warn(`unrecognized payload: ${req.body}`);
        res.sendStatus(400);
      }
      if (buildHash === state.manifest?.version) {
        state.appReady?.ok();
      }
      res.sendStatus(200);
    });

  let server =
    options.tlsKey && options.tlsCert
      ? https.createServer(
          {
            key: fs.readFileSync(options.tlsKey),
            cert: fs.readFileSync(options.tlsCert),
          },
          app
        )
      : http.createServer(app);
  let websocket = Socket.serve(server);

  let bin = await detectBin();
  let startAppServer = (command?: string) => {
    let cmd =
      command ??
      `remix-serve ${path.relative(
        process.cwd(),
        initialConfig.serverBuildPath
      )}`;
    let newAppServer = execa
      .command(cmd, {
        stdio: "pipe",
        env: {
          NODE_ENV: "development",
          PATH:
            bin + (process.platform === "win32" ? ";" : ":") + process.env.PATH,
          REMIX_DEV_ORIGIN: options.REMIX_DEV_ORIGIN.href,
          FORCE_COLOR: process.env.NO_COLOR === undefined ? "1" : "0",
        },
        // https://github.com/sindresorhus/execa/issues/433
        windowsHide: false,
      })
      .on("error", (e) => {
        // patch execa error types
        invariant("errno" in e && typeof e.errno === "number", "errno missing");
        invariant("code" in e && typeof e.code === "string", "code missing");
        invariant("path" in e && typeof e.path === "string", "path missing");

        if (command === undefined) {
          logger.error(`command not found: ${e.path}`, {
            details: [
              `\`remix dev\` did not receive \`--command\` nor \`-c\`, defaulting to \`${cmd}\`.`,
              "You probably meant to use `-c` for your app server command.",
              "For example: `remix dev -c 'node ./server.js'`",
            ],
          });
          process.exit(1);
        }
        logger.error("app failed to start" + pc.gray(` (${command})`));
        throw e;
      });

    if (newAppServer.stdin)
      process.stdin.pipe(newAppServer.stdin, { end: true });
    if (newAppServer.stderr)
      newAppServer.stderr.pipe(process.stderr, { end: false });
    if (newAppServer.stdout) {
      newAppServer.stdout
        .pipe(
          new stream.PassThrough({
            transform(chunk, _, callback) {
              let str: string = chunk.toString();
              let matches =
                str && str.matchAll(/\[REMIX DEV\] ([A-Fa-f0-9]+) ready/g);
              if (matches) {
                for (let match of matches) {
                  let buildHash = match[1];
                  if (buildHash === state.manifest?.version) {
                    state.appReady?.ok();
                  }
                }
              }

              callback(null, chunk);
            },
          })
        )
        .pipe(process.stdout, { end: false });
    }

    return newAppServer;
  };

  let fileWatchCache = createFileWatchCache();

  let dispose = await Compiler.watch(
    {
      config: initialConfig,
      options: {
        mode: "development",
        sourcemap: true,
        REMIX_DEV_ORIGIN: options.REMIX_DEV_ORIGIN,
      },
      fileWatchCache,
      logger,
    },
    {
      onBuildStart: async (ctx) => {
        // stop listening for previous manifest
        state.appReady?.err();

        clean(ctx.config);
        if (!state.prevManifest) {
          let msg = "building...";
          websocket.log(msg);
          logger.info(msg);
        }

        state.loaderChanges = HDR.detectLoaderChanges(ctx).then(ok, err);
      },
      onBuildManifest: (manifest: Manifest) => {
        state.manifest = manifest;
        state.appReady = Channel.create();
      },
      onBuildFinish: async (ctx, durationMs, succeeded) => {
        if (!succeeded) return;

        let msg =
          (state.prevManifest ? "rebuilt" : "built") +
          pc.gray(` (${prettyMs(durationMs)})`);
        websocket.log(msg);
        logger.info(msg);

        // accumulate new state, but only update state after updates are processed
        let newState: typeof state = { prevManifest: state.manifest };
        try {
          let start = Date.now();
          if (state.appServer === undefined || !options.manual) {
            if (state.appServer?.pid) {
              await killtree(state.appServer.pid);
            }
            state.appServer = startAppServer(options.command);
          }
          let appReady = await state.appReady!.result;
          if (!appReady.ok) return;
          if (state.prevManifest) {
            logger.info(
              `app server ready` + pc.gray(` (${prettyMs(Date.now() - start)})`)
            );
          }

          // HMR + HDR
          let loaderChanges = await state.loaderChanges!;
          if (loaderChanges.ok) {
            newState.prevLoaderHashes = loaderChanges.value;
          }
          if (loaderChanges?.ok && state.manifest && state.prevManifest) {
            let updates = HMR.updates(
              ctx.config,
              state.manifest,
              state.prevManifest,
              loaderChanges.value,
              state.prevLoaderHashes
            );
            websocket.hmr(state.manifest, updates);

            let hdr = updates.some((u) => u.revalidate);
            logger.info("hmr" + (hdr ? " + hdr" : ""));
            return;
          }

          // Live Reload
          if (state.prevManifest !== undefined) {
            websocket.reload();
            logger.info("live reload");
          }
        } finally {
          // commit accumulated state
          Object.assign(state, newState);
          process.stdout.write("\n");
        }
      },
      onFileCreated: (file) => {
        logger.info(`rebuilding...` + pc.gray(` (+ ${relativePath(file)})`));
        websocket.log(`file created: ${relativePath(file)}`);
      },
      onFileChanged: (file) => {
        logger.info(`rebuilding...` + pc.gray(` (~ ${relativePath(file)})`));
        websocket.log(`file changed: ${relativePath(file)}`);
        fileWatchCache.invalidateFile(file);
      },
      onFileDeleted: (file) => {
        logger.info(`rebuilding` + pc.gray(` (- ${relativePath(file)})`));
        websocket.log(`file deleted: ${relativePath(file)}`);
        fileWatchCache.invalidateFile(file);
      },
    }
  );

  server.listen(options.port);

  let cleanup = async () => {
    state.appServer?.kill();
    websocket.close();
    server.close();
    await dispose();
  };
  exitHook(cleanup);
  return cleanup;
};

let clean = (config: RemixConfig) => {
  try {
    fs.emptyDirSync(config.relativeAssetsBuildDirectory);
  } catch {}
};

let relativePath = (file: string) => path.relative(process.cwd(), file);
