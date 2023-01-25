import exitHook from "exit-hook";
import fse from "fs-extra";
import path from "path";
import prettyMs from "pretty-ms";
import WebSocket from "ws";

import type { WatchOptions } from "../compiler";
import { watch } from "../compiler";
import type { RemixConfig } from "../config";

const relativePath = (file: string) => path.relative(process.cwd(), file);

let clean = (config: RemixConfig) => {
  fse.emptyDirSync(config.assetsBuildDirectory);
};

export async function liveReload(
  config: RemixConfig,
  options: WatchOptions = {}
) {
  clean(config);
  let wss = new WebSocket.Server({ port: config.devServerPort });
  function broadcast(event: { type: string } & Record<string, unknown>) {
    setTimeout(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    }, config.devServerBroadcastDelay);
  }

  function log(message: string) {
    let _message = `💿 ${message}`;
    console.log(_message);
    broadcast({ type: "LOG", message: _message });
  }

  let dispose = await watch(config, {
    mode: options.mode,
    onInitialBuild: options.onInitialBuild,
    onRebuildStart() {
      clean(config);
      log("Rebuilding...");
    },
    onRebuildFinish(durationMs: number) {
      log(`Rebuilt in ${prettyMs(durationMs)}`);
      broadcast({ type: "RELOAD" });
    },
    onFileCreated(file) {
      log(`File created: ${relativePath(file)}`);
    },
    onFileChanged(file) {
      log(`File changed: ${relativePath(file)}`);
    },
    onFileDeleted(file) {
      log(`File deleted: ${relativePath(file)}`);
    },
  });

  exitHook(() => clean(config));
  return async () => {
    wss.close();
    await dispose();
  };
}
