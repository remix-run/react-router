import fs from "fs-extra";
import path from "node:path";
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

export let serve = async (
  config: RemixConfig,
  options: {
    command?: string;
    httpPort: number;
    websocketPort: number;
    restart: boolean;
  }
) => {
  await loadEnv(config.rootDirectory);
  let websocket = Socket.serve({ port: options.websocketPort });

  let state: {
    latestBuildHash?: string;
    buildHashChannel?: Channel.Type<void>;
    appServer?: execa.ExecaChildProcess;
    prevManifest?: Manifest;
  } = {};

  let pkgManager = detectPackageManager() ?? "npm";
  let bin = (await execa(pkgManager, ["bin"])).stdout.trim();
  let startAppServer = (command: string) => {
    return execa.command(command, {
      stdio: "inherit",
      env: {
        NODE_ENV: "development",
        PATH: `${bin}:${process.env.PATH}`,
        REMIX_DEV_HTTP_PORT: String(options.httpPort),
      },
    });
  };

  let dispose = await Compiler.watch(
    {
      config,
      options: {
        mode: "development",
        sourcemap: true,
        onWarning: warnOnce,
        devHttpPort: options.httpPort,
        devWebsocketPort: options.websocketPort,
      },
    },
    {
      onInitialBuild: (durationMs, manifest) => {
        console.info(`💿 Built in ${prettyMs(durationMs)}`);
        state.prevManifest = manifest;
        if (options.command && manifest) {
          console.log(`starting: ${options.command}`);
          state.appServer = startAppServer(options.command);
        }
      },
      onRebuildStart: () => {
        state.buildHashChannel?.err();
        clean(config);
        websocket.log("Rebuilding...");
      },
      onRebuildFinish: async (durationMs, manifest) => {
        if (!manifest) return;
        websocket.log(`Rebuilt in ${prettyMs(durationMs)}`);

        // TODO: should we restart the app server when build failed?
        state.latestBuildHash = manifest.version;
        state.buildHashChannel = Channel.create();
        console.log(`Waiting (${state.latestBuildHash})`);
        if (state.appServer === undefined || options.restart) {
          console.log(`restarting: ${options.command}`);
          await kill(state.appServer);
          if (options.command) {
            state.appServer = startAppServer(options.command);
          }
        }
        let { ok } = await state.buildHashChannel.result;
        // result not ok -> new build started before this one finished. do not process outdated manifest
        if (!ok) return;

        if (manifest.hmr && state.prevManifest) {
          let updates = HMR.updates(config, manifest, state.prevManifest);
          websocket.hmr(manifest, updates);
          console.log("> HMR");
        } else {
          websocket.reload();
          console.log("> Reload");
        }
        state.prevManifest = manifest;
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
    .use(express.json())
    .post("/ping", (req, res) => {
      let { buildHash } = req.body;
      if (typeof buildHash !== "string") {
        console.warn(`Unrecognized payload: ${req.body}`);
        res.sendStatus(400);
      }
      if (buildHash === state.latestBuildHash) {
        state.buildHashChannel?.ok();
      }
      res.sendStatus(200);
    })
    .listen(options.httpPort, () => {
      console.log(`dev server listening on port ${options.httpPort}`);
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
  // `execa`'s `kill` is not reliable on windows
  if (process.platform === "win32") {
    await execa("taskkill", ["/pid", String(p.pid), "/f", "/t"]);
    return;
  }
  p.kill();
};
