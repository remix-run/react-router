import * as path from "path";
import * as fse from "fs-extra";
import signalExit from "signal-exit";
import prettyMs from "pretty-ms";
import WebSocket from "ws";
import type { Server } from "http";
import type * as Express from "express";
import type { createApp as createAppType } from "@remix-run/serve";

import { BuildMode, isBuildMode } from "../build";
import * as compiler from "../compiler";
import type { RemixConfig } from "../config";
import { readConfig } from "../config";
import { formatRoutes, RoutesFormat, isRoutesFormat } from "../config/format";
import { setupRemix, isSetupPlatform, SetupPlatform } from "../setup";

export async function setup(platformArg?: string) {
  let platform = isSetupPlatform(platformArg)
    ? platformArg
    : SetupPlatform.Node;

  await setupRemix(platform);

  console.log(`Successfully setup Remix for ${platform}.`);
}

export async function routes(
  remixRoot: string,
  formatArg?: string
): Promise<void> {
  let config = await readConfig(remixRoot);

  let format = isRoutesFormat(formatArg) ? formatArg : RoutesFormat.jsx;

  console.log(formatRoutes(config.routes, format));
}

export async function build(
  remixRoot: string,
  modeArg?: string,
  sourcemap: boolean = false
): Promise<void> {
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Production;

  console.log(`Building Remix app in ${mode} mode...`);

  if (modeArg === BuildMode.Production && sourcemap) {
    console.warn(
      "\n⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️"
    );
    console.warn(
      "You have enabled source maps in production. This will make your server side code visible to the public and is highly discouraged! If you insist, please ensure you are using environment variables for secrets and not hard-coding them into your source!"
    );
    console.warn(
      "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️\n"
    );
  }

  let start = Date.now();
  let config = await readConfig(remixRoot);
  await compiler.build(config, { mode: mode, sourcemap });

  console.log(`Built in ${prettyMs(Date.now() - start)}`);
}

type WatchCallbacks = {
  onRebuildStart?(): void;
  onInitialBuild?(): void;
};

export async function watch(
  remixRootOrConfig: string | RemixConfig,
  modeArg?: string,
  callbacks?: WatchCallbacks
): Promise<void> {
  let { onInitialBuild, onRebuildStart } = callbacks || {};
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Development;
  console.log(`Watching Remix app in ${mode} mode...`);

  let start = Date.now();
  let config =
    typeof remixRootOrConfig === "object"
      ? remixRootOrConfig
      : await readConfig(remixRootOrConfig);

  let wss = new WebSocket.Server({ port: config.devServerPort });
  function broadcast(event: { type: string; [key: string]: any }) {
    setTimeout(() => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    }, config.devServerBroadcastDelay);
  }

  function log(_message: string) {
    let message = `💿 ${_message}`;
    console.log(message);
    broadcast({ type: "LOG", message });
  }

  let closeWatcher = await compiler.watch(config, {
    mode,
    onInitialBuild,
    onRebuildStart() {
      start = Date.now();
      onRebuildStart && onRebuildStart();
      log("Rebuilding...");
    },
    onRebuildFinish() {
      log(`Rebuilt in ${prettyMs(Date.now() - start)}`);
      broadcast({ type: "RELOAD" });
    },
    onFileCreated(file) {
      log(`File created: ${path.relative(process.cwd(), file)}`);
    },
    onFileChanged(file) {
      log(`File changed: ${path.relative(process.cwd(), file)}`);
    },
    onFileDeleted(file) {
      log(`File deleted: ${path.relative(process.cwd(), file)}`);
    }
  });

  console.log(`💿 Built in ${prettyMs(Date.now() - start)}`);

  let resolve: () => void;
  signalExit(() => {
    resolve();
  });
  return new Promise<void>(r => {
    resolve = r;
  }).then(async () => {
    wss.close();
    await closeWatcher();
    fse.emptyDirSync(config.assetsBuildDirectory);
    fse.emptyDirSync(config.serverBuildDirectory);
  });
}

export async function dev(remixRoot: string, modeArg?: string) {
  // TODO: Warn about the need to install @remix-run/serve if it isn't there?
  let createApp: typeof createAppType;
  let express: typeof Express;
  try {
    let serve = require("@remix-run/serve");
    createApp = serve.createApp;
    express = require("express");
  } catch (err) {
    throw new Error(
      "Could not locate @remix-run/serve. Please verify you have it installed to use the dev command."
    );
  }

  let config = await readConfig(remixRoot);
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Development;
  let port = process.env.PORT || 3000;

  let app = express();
  app.use((_, __, next) => {
    purgeAppRequireCache(config.serverBuildDirectory);
    next();
  });
  app.use(createApp(config.serverBuildDirectory, mode));

  let server: Server | null = null;

  try {
    await watch(config, mode, {
      onInitialBuild: () => {
        server = app.listen(port, () => {
          console.log(`Remix App Server started at http://localhost:${port}`);
        });
      }
    });
  } finally {
    server!?.close();
  }
}

function purgeAppRequireCache(buildPath: string) {
  for (let key in require.cache) {
    if (key.startsWith(buildPath)) {
      delete require.cache[key];
    }
  }
}
