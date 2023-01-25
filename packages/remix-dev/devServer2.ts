import exitHook from "exit-hook";
import fs from "fs-extra";
import getPort, { makeRange } from "get-port";
import os from "os";
import path from "node:path";
import prettyMs from "pretty-ms";
import fetch from "node-fetch";

import { type AssetsManifest } from "./assets-manifest";
import * as Compiler from "./compiler";
import { type RemixConfig } from "./config";
import { loadEnv } from "./env";
import * as LiveReload from "./liveReload";

let info = (message: string) => console.info(`💿 ${message}`);

let relativePath = (file: string) => path.relative(process.cwd(), file);

let sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let clean = (config: RemixConfig) => {
  fs.emptyDirSync(config.relativeAssetsBuildDirectory);
};

let getHost = () =>
  process.env.HOST ??
  Object.values(os.networkInterfaces())
    .flat()
    .find((ip) => String(ip?.family).includes("4") && !ip?.internal)?.address;

let findPort = async (portPreference?: number) =>
  getPort({
    port:
      // prettier-ignore
      portPreference ? Number(portPreference) :
        process.env.PORT ? Number(process.env.PORT) :
          makeRange(3001, 3100),
  });

let fetchAssetsManifest = async (
  origin: string,
  remixRequestHandlerPath: string
): Promise<AssetsManifest | undefined> => {
  try {
    let url = origin + remixRequestHandlerPath + "/__REMIX_ASSETS_MANIFEST";
    let res = await fetch(url);
    let assetsManifest = (await res.json()) as AssetsManifest;
    return assetsManifest;
  } catch (error) {
    return undefined;
  }
};

let resolveDev = (
  dev: RemixConfig["future"]["unstable_dev"],
  flags: { port?: number; appServerPort?: number }
) => {
  if (dev === false)
    throw Error("The new dev server requires 'unstable_dev' to be set");

  let port = flags.port ?? (dev === true ? undefined : dev.port);
  let appServerPort =
    flags.appServerPort ?? (dev === true || dev.appServerPort == undefined)
      ? 3000
      : dev.appServerPort;
  let remixRequestHandlerPath =
    dev === true || dev.remixRequestHandlerPath === undefined
      ? ""
      : dev.remixRequestHandlerPath;
  let rebuildPollIntervalMs =
    dev === true || dev.rebuildPollIntervalMs === undefined
      ? 50
      : dev.rebuildPollIntervalMs;

  return {
    port,
    appServerPort,
    remixRequestHandlerPath,
    rebuildPollIntervalMs,
  };
};

export let serve = async (
  config: RemixConfig,
  flags: { port?: number; appServerPort?: number } = {}
) => {
  clean(config);
  await loadEnv(config.rootDirectory);

  let dev = resolveDev(config.future.unstable_dev, flags);

  let host = getHost();
  let appServerOrigin = `http://${host ?? "localhost"}:${dev.appServerPort}`;

  let waitForAppServer = async (buildHash: string) => {
    while (true) {
      // TODO AbortController signal to cancel responses?
      let assetsManifest = await fetchAssetsManifest(
        appServerOrigin,
        dev.remixRequestHandlerPath
      );
      if (assetsManifest?.version === buildHash) return;

      await sleep(dev.rebuildPollIntervalMs);
    }
  };

  // watch and live reload on rebuilds
  let port = await findPort(dev.port);
  let socket = LiveReload.serve({ port });
  let dispose = await Compiler.watch(config, {
    mode: "development",
    liveReloadPort: port,
    onInitialBuild: (durationMs) => info(`Built in ${prettyMs(durationMs)}`),
    onRebuildStart: () => {
      clean(config);
      socket.log("Rebuilding...");
    },
    onRebuildFinish: async (durationMs, assetsManifest) => {
      if (!assetsManifest) return;
      socket.log(`Rebuilt in ${prettyMs(durationMs)}`);

      info(`Waiting for ${appServerOrigin}...`);
      let start = Date.now();
      await waitForAppServer(assetsManifest.version);
      info(`${appServerOrigin} ready in ${prettyMs(Date.now() - start)}`);

      socket.reload();
    },
    onFileCreated: (file) => socket.log(`File created: ${relativePath(file)}`),
    onFileChanged: (file) => socket.log(`File changed: ${relativePath(file)}`),
    onFileDeleted: (file) => socket.log(`File deleted: ${relativePath(file)}`),
  });

  // clean up build directories when dev server exits
  exitHook(() => clean(config));
  return async () => {
    await dispose();
    socket.close();
  };
};
