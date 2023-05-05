import * as path from "node:path";
import * as stream from "node:stream";
import fs from "fs-extra";
import prettyMs from "pretty-ms";
import execa from "execa";
import express from "express";

import * as Channel from "../channel";
import { type Manifest } from "../manifest";
import * as Compiler from "../compiler";
import { type RemixConfig } from "../config";
import { loadEnv } from "./env";
import * as Socket from "./socket";
import * as HMR from "./hmr";
import { warnOnce } from "../warnOnce";
import { detectPackageManager } from "../cli/detectPackageManager";
import * as HDR from "./hdr";

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
    return stdout.trim() + "/node_modules/.bin";
  }
  let { stdout } = await execa(pkgManager, ["bin"]);
  return stdout.trim();
};

export let serve = async (
  initialConfig: RemixConfig,
  options: {
    command: string;
    httpScheme: string;
    httpHost: string;
    httpPort: number;
    webSocketPort: number;
    restart: boolean;
  }
) => {
  await loadEnv(initialConfig.rootDirectory);
  let websocket = Socket.serve({ port: options.webSocketPort });
  let httpOrigin: Origin = {
    scheme: options.httpScheme,
    host: options.httpHost,
    port: options.httpPort,
  };

  let state: {
    appServer?: execa.ExecaChildProcess;
    manifest?: Manifest;
    prevManifest?: Manifest;
    appReady?: Channel.Type<void>;
    hdr?: Promise<Record<string, string>>;
    prevLoaderHashes?: Record<string, string>;
  } = {};

  let bin = await detectBin();
  let startAppServer = (command: string) => {
    console.log(`> ${command}`);
    let newAppServer = execa.command(command, {
      stdio: "pipe",
      env: {
        NODE_ENV: "development",
        PATH: `${bin}:${process.env.PATH}`,
        REMIX_DEV_HTTP_ORIGIN: stringifyOrigin(httpOrigin),
      },
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

  let dispose = await Compiler.watch(
    {
      config: initialConfig,
      options: {
        mode: "development",
        sourcemap: true,
        onWarning: warnOnce,
        devHttpOrigin: httpOrigin,
        devWebSocketPort: options.webSocketPort,
      },
    },
    {
      onBuildStart: async (ctx) => {
        state.appReady?.err();
        clean(ctx.config);
        websocket.log(state.prevManifest ? "Rebuilding..." : "Building...");

        state.hdr = HDR.detectLoaderChanges(ctx);
      },
      onBuildManifest: (manifest: Manifest) => {
        state.manifest = manifest;
      },
      onBuildFinish: async (ctx, durationMs, succeeded) => {
        if (!succeeded) return;

        websocket.log(
          (state.prevManifest ? "Rebuilt" : "Built") +
            ` in ${prettyMs(durationMs)}`
        );
        state.appReady = Channel.create();

        let start = Date.now();
        console.log(`Waiting for app server (${state.manifest?.version})`);
        if (
          options.command &&
          (state.appServer === undefined || options.restart)
        ) {
          await kill(state.appServer);
          state.appServer = startAppServer(options.command);
        }
        let { ok } = await state.appReady.result;
        // result not ok -> new build started before this one finished. do not process outdated manifest
        let loaderHashes = await state.hdr;
        if (ok) {
          console.log(`App server took ${prettyMs(Date.now() - start)}`);
          if (state.manifest && loaderHashes && state.prevManifest) {
            let updates = HMR.updates(
              ctx.config,
              state.manifest,
              state.prevManifest,
              loaderHashes,
              state.prevLoaderHashes
            );
            websocket.hmr(state.manifest, updates);

            let hdr = updates.some((u) => u.revalidate);
            console.log("> HMR" + (hdr ? " + HDR" : ""));
          } else if (state.prevManifest !== undefined) {
            websocket.reload();
            console.log("> Live reload");
          }
        }
        state.prevManifest = state.manifest;
        state.prevLoaderHashes = loaderHashes;
      },
      onFileCreated: (file) =>
        websocket.log(`File created: ${relativePath(file)}`),
      onFileChanged: (file) =>
        websocket.log(`File changed: ${relativePath(file)}`),
      onFileDeleted: (file) =>
        websocket.log(`File deleted: ${relativePath(file)}`),
    }
  );

  let httpServer = express()
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
    })
    .listen(httpOrigin.port, () => {
      console.log("Remix dev server ready");
    });

  return new Promise(() => {}).finally(async () => {
    await kill(state.appServer);
    websocket.close();
    httpServer.close();
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
