import * as path from "node:path";
import * as stream from "node:stream";
import * as http from "node:http";
import * as https from "node:https";
import fs from "fs-extra";
import prettyMs from "pretty-ms";
import execa from "execa";
import express from "express";

import * as Channel from "../channel";
import { type Manifest } from "../manifest";
import * as Compiler from "../compiler";
import { createFileWatchCache } from "../compiler/fileWatchCache";
import { type RemixConfig } from "../config";
import { loadEnv } from "./env";
import * as Socket from "./socket";
import * as HMR from "./hmr";
import { warnOnce } from "../warnOnce";
import { detectPackageManager } from "../cli/detectPackageManager";
import * as HDR from "./hdr";
import type { Result } from "../result";
import { err, ok } from "../result";
import invariant from "../invariant";

type Origin = {
  scheme: string;
  host: string;
  port: number;
};

let stringifyOrigin = (o: Origin) => `${o.scheme}://${o.host}:${o.port}`;

let detectBin = async (): Promise<string> => {
  let pkgManager = detectPackageManager() ?? "npm";
  if (pkgManager === "npm") {
    // npm v9 removed the `bin` command, so have to use `prefix`
    let { stdout } = await execa(pkgManager, ["prefix"]);
    return path.join(stdout.trim(), "node_modules", ".bin");
  }
  let { stdout } = await execa(pkgManager, ["bin"]);
  return stdout.trim();
};

export let serve = async (
  initialConfig: RemixConfig,
  options: {
    command?: string;
    scheme: string;
    host: string;
    port: number;
    restart: boolean;
    tlsKey?: string;
    tlsCert?: string;
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
        console.warn(`Unrecognized payload: ${req.body}`);
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

  let origin: Origin = {
    scheme: options.scheme,
    host: options.host,
    port: options.port,
  };

  let bin = await detectBin();
  let startAppServer = (command?: string) => {
    let cmd =
      command ??
      `remix-serve ${path.relative(
        process.cwd(),
        initialConfig.serverBuildPath
      )}`;
    console.log(`> ${cmd}`);
    let newAppServer = execa
      .command(cmd, {
        stdio: "pipe",
        env: {
          NODE_ENV: "development",
          PATH:
            bin + (process.platform === "win32" ? ";" : ":") + process.env.PATH,
          REMIX_DEV_HTTP_ORIGIN: stringifyOrigin(origin),
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
          console.error(
            [
              "",
              `┏ [error] command not found: ${e.path}`,
              `┃ \`remix dev\` did not receive \`--command\` nor \`-c\`, defaulting to \`${cmd}\`.`,
              "┃ You probably meant to use `-c` for your app server command.",
              "┗ For example: `remix dev -c 'node ./server.js'`",
              "",
            ].join("\n")
          );
          process.exit(1);
        }
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
                str && str.matchAll(/\[REMIX DEV\] ([A-f0-9]+) ready/g);
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
        onWarning: warnOnce,
        devOrigin: origin,
      },
      fileWatchCache,
    },
    {
      onBuildStart: async (ctx) => {
        // stop listening for previous manifest
        state.appReady?.err();

        clean(ctx.config);
        websocket.log(state.prevManifest ? "Rebuilding..." : "Building...");

        state.loaderChanges = HDR.detectLoaderChanges(ctx).then(ok, err);
      },
      onBuildManifest: (manifest: Manifest) => {
        state.manifest = manifest;
        state.appReady = Channel.create();
      },
      onBuildFinish: async (ctx, durationMs, succeeded) => {
        if (!succeeded) return;
        websocket.log(
          (state.prevManifest ? "Rebuilt" : "Built") +
            ` in ${prettyMs(durationMs)}`
        );

        // accumulate new state, but only update state after updates are processed
        let newState: typeof state = { prevManifest: state.manifest };
        try {
          console.log(`Waiting for app server (${state.manifest?.version})`);
          let start = Date.now();
          if (state.appServer === undefined || options.restart) {
            await kill(state.appServer);
            state.appServer = startAppServer(options.command);
          }
          let appReady = await state.appReady!.result;
          if (!appReady.ok) return;
          console.log(`App server took ${prettyMs(Date.now() - start)}`);

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
            console.log("> HMR" + (hdr ? " + HDR" : ""));
            return;
          }

          // Live Reload
          if (state.prevManifest !== undefined) {
            websocket.reload();
            console.log("> Live reload");
          }
        } finally {
          // commit accumulated state
          Object.assign(state, newState);
        }
      },
      onFileCreated: (file) =>
        websocket.log(`File created: ${relativePath(file)}`),
      onFileChanged: (file) => {
        websocket.log(`File changed: ${relativePath(file)}`);
        fileWatchCache.invalidateFile(file);
      },
      onFileDeleted: (file) => {
        websocket.log(`File deleted: ${relativePath(file)}`);
        fileWatchCache.invalidateFile(file);
      },
    }
  );

  server.listen(origin.port, () => {
    console.log("Remix dev server ready");
  });

  return new Promise(() => {}).finally(async () => {
    await kill(state.appServer);
    websocket.close();
    server.close();
    await dispose();
  });
};

let clean = (config: RemixConfig) => {
  try {
    fs.emptyDirSync(config.relativeAssetsBuildDirectory);
  } catch {}
};

let relativePath = (file: string) => path.relative(process.cwd(), file);

let kill = async (p?: execa.ExecaChildProcess) => {
  if (p === undefined) return;
  let channel = Channel.create<void>();
  p.on("exit", channel.ok);

  // https://github.com/nodejs/node/issues/12378
  if (process.platform === "win32") {
    await execa("taskkill", ["/pid", String(p.pid), "/f", "/t"]);
  } else {
    p.kill("SIGTERM", { forceKillAfterTimeout: 1_000 });
  }

  await channel.result;
};
