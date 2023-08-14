import exitHook from "exit-hook";
import fse from "fs-extra";
import path from "node:path";
import prettyMs from "pretty-ms";
import WebSocket from "ws";

import { watch } from "../compiler";
import type { RemixConfig } from "../config";
import { createFileWatchCache } from "../compiler/fileWatchCache";
import { logger } from "../tux";

const relativePath = (file: string) => path.relative(process.cwd(), file);

let clean = (config: RemixConfig) => {
  try {
    fse.emptyDirSync(config.assetsBuildDirectory);
  } catch {
    // ignore failed clean up attempts
  }
};

export async function liveReload(
  config: RemixConfig,
  options: { port: number; mode: string }
) {
  clean(config);
  let wss = new WebSocket.Server({ port: options.port });
  function broadcast(event: { type: string } & Record<string, unknown>) {
    setTimeout(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    }, 500);
  }

  function log(message: string) {
    let _message = `💿 ${message}`;
    console.log(_message);
    broadcast({ type: "LOG", message: _message });
  }

  let fileWatchCache = createFileWatchCache();

  let hasBuilt = false;
  let dispose = await watch(
    {
      config,
      options: {
        mode: options.mode,
        sourcemap: true,
      },
      fileWatchCache,
      logger,
    },
    {
      onBuildStart() {
        clean(config);
        log((hasBuilt ? "Rebuilding" : "Building") + "...");
      },
      onBuildFinish(_, durationMs: number, manifest) {
        if (manifest === undefined) return;
        hasBuilt = true;
        log((hasBuilt ? "Rebuilt" : "Built") + ` in ${prettyMs(durationMs)}`);
        broadcast({ type: "RELOAD" });
      },
      onFileCreated(file) {
        log(`File created: ${relativePath(file)}`);
      },
      onFileChanged(file) {
        log(`File changed: ${relativePath(file)}`);
        fileWatchCache.invalidateFile(file);
      },
      onFileDeleted(file) {
        log(`File deleted: ${relativePath(file)}`);
        fileWatchCache.invalidateFile(file);
      },
    }
  );

  let heartbeat = setInterval(broadcast, 60000, { type: "PING" });

  exitHook(() => clean(config));
  return async () => {
    wss.close();
    clearInterval(heartbeat);
    await dispose();
  };
}
