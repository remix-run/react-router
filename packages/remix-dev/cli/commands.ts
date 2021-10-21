import * as path from "path";
import * as fse from "fs-extra";
import signalExit from "signal-exit";
import prettyMs from "pretty-ms";
import WebSocket from "ws";

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
  modeArg?: string
): Promise<void> {
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Production;

  console.log(`Building Remix app in ${mode} mode...`);

  let start = Date.now();
  let config = await readConfig(remixRoot);
  await compiler.build(config, { mode: mode });

  console.log(`Built in ${prettyMs(Date.now() - start)}`);
}

export async function watch(
  remixRootOrConfig: string | RemixConfig,
  modeArg?: string,
  onRebuildStart?: () => void
): Promise<void> {
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

  signalExit(
    await compiler.watch(config, {
      mode,
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
    })
  );

  signalExit(() => {
    fse.emptyDirSync(config.assetsBuildDirectory);
    fse.emptyDirSync(config.serverBuildDirectory);
  });

  console.log(`💿 Built in ${prettyMs(Date.now() - start)}`);
}

export async function dev(remixRoot: string, modeArg?: string) {
  // TODO: Warn about the need to install @remix-run/serve if it isn't there?
  let { createApp } = require("@remix-run/serve");

  let config = await readConfig(remixRoot);
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Development;
  let port = process.env.PORT || 3000;

  createApp(config.serverBuildDirectory, mode).listen(port, () => {
    console.log(`Remix App Server started at http://localhost:${port}`);
  });

  watch(config, mode, () => {
    purgeAppRequireCache(config.serverBuildDirectory);
  });
}

function purgeAppRequireCache(buildPath: string) {
  for (let key in require.cache) {
    if (key.startsWith(buildPath)) {
      delete require.cache[key];
    }
  }
}
