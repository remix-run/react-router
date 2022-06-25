import * as path from "path";
import os from "os";
import { execSync } from "child_process";
import * as fse from "fs-extra";
import exitHook from "exit-hook";
import ora from "ora";
import prettyMs from "pretty-ms";
import WebSocket from "ws";
import type { Server } from "http";
import type * as Express from "express";
import type { createApp as createAppType } from "@remix-run/serve";
import getPort, { makeRange } from "get-port";

import { BuildMode, isBuildMode } from "../build";
import * as colors from "../colors";
import * as compiler from "../compiler";
import type { RemixConfig } from "../config";
import { readConfig } from "../config";
import { formatRoutes, RoutesFormat, isRoutesFormat } from "../config/format";
import { loadEnv } from "../env";
import { log } from "../logging";
import { createApp } from "./create";
import { getPreferredPackageManager } from "./getPreferredPackageManager";
import { setupRemix, isSetupPlatform, SetupPlatform } from "./setup";

export * as migrate from "./migrate";

export async function create({
  appTemplate,
  projectDir,
  remixVersion,
  installDeps,
  useTypeScript,
  githubToken,
  debug,
}: {
  appTemplate: string;
  projectDir: string;
  remixVersion?: string;
  installDeps: boolean;
  useTypeScript: boolean;
  githubToken?: string;
  debug?: boolean;
}) {
  let spinner = ora("Creating your app…").start();
  await createApp({
    appTemplate,
    projectDir,
    remixVersion,
    installDeps,
    useTypeScript,
    githubToken,
    debug,
  });
  spinner.stop();
  spinner.clear();
}

export async function init(projectDir: string) {
  let initScriptDir = path.join(projectDir, "remix.init");
  let initScript = path.resolve(initScriptDir, "index.js");

  if (!(await fse.pathExists(initScript))) {
    return;
  }

  let initPackageJson = path.resolve(initScriptDir, "package.json");
  let isTypeScript = fse.existsSync(path.join(projectDir, "tsconfig.json"));
  let packageManager = getPreferredPackageManager();

  if (await fse.pathExists(initPackageJson)) {
    execSync(`${packageManager} install`, {
      cwd: initScriptDir,
      stdio: "ignore",
    });
  }

  let initFn = require(initScript);
  try {
    await initFn({ isTypeScript, packageManager, rootDirectory: projectDir });

    await fse.remove(initScriptDir);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `${colors.error("🚨 Oops, remix.init failed")}\n\n${
        error.message
      }`;
    }
    throw error;
  }
}

export async function setup(platformArg?: string) {
  let platform: SetupPlatform;
  if (
    platformArg === "cloudflare-workers" ||
    platformArg === "cloudflare-pages"
  ) {
    console.warn(
      `Using '${platformArg}' as a platform value is deprecated. Use ` +
        "'cloudflare' instead."
    );
    console.log("HINT: check the `postinstall` script in `package.json`");
    platform = SetupPlatform.Cloudflare;
  } else {
    platform = isSetupPlatform(platformArg) ? platformArg : SetupPlatform.Node;
  }

  await setupRemix(platform);

  log(`Successfully setup Remix for ${platform}.`);
}

export async function routes(
  remixRoot?: string,
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

  log(`Building Remix app in ${mode} mode...`);

  if (modeArg === BuildMode.Production && sourcemap) {
    console.warn(
      "\n⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️"
    );
    console.warn(
      "You have enabled source maps in production. This will make your " +
        "server-side code visible to the public and is highly discouraged! If " +
        "you insist, please ensure you are using environment variables for " +
        "secrets and not hard-coding them into your source!"
    );
    console.warn(
      "⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️\n"
    );
  }

  let start = Date.now();
  let config = await readConfig(remixRoot);
  fse.emptyDirSync(config.assetsBuildDirectory);
  await compiler.build(config, {
    mode: mode,
    sourcemap,
    onBuildFailure: (failure: compiler.BuildError) => {
      compiler.formatBuildFailure(failure);
      throw Error();
    },
  });

  log(`Built in ${prettyMs(Date.now() - start)}`);
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
      wss.clients.forEach((client) => {
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
      onRebuildStart?.();
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
    },
  });

  console.log(`💿 Built in ${prettyMs(Date.now() - start)}`);

  let resolve: () => void;
  exitHook(() => {
    resolve();
  });
  return new Promise<void>((r) => {
    resolve = r;
  }).then(async () => {
    wss.close();
    await closeWatcher();
    fse.emptyDirSync(config.assetsBuildDirectory);
    fse.rmSync(config.serverBuildPath);
  });
}

export async function dev(
  remixRoot: string,
  modeArg?: string,
  portArg?: number
) {
  let createApp: typeof createAppType;
  let express: typeof Express;
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    let serve = require("@remix-run/serve");
    createApp = serve.createApp;
    express = require("express");
  } catch (err) {
    throw new Error(
      "Could not locate @remix-run/serve. Please verify you have it installed " +
        "to use the dev command."
    );
  }

  let config = await readConfig(remixRoot);
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Development;

  await loadEnv(config.rootDirectory);

  let port = await getPort({
    port: portArg
      ? Number(portArg)
      : process.env.PORT
      ? Number(process.env.PORT)
      : makeRange(3000, 3100),
  });

  if (config.serverEntryPoint) {
    throw new Error("remix dev is not supported for custom servers.");
  }

  let app = express();
  app.disable("x-powered-by");
  app.use((_, __, next) => {
    purgeAppRequireCache(config.serverBuildPath);
    next();
  });
  app.use(createApp(config.serverBuildPath, mode));

  let server: Server | null = null;

  try {
    await watch(config, mode, {
      onInitialBuild: () => {
        let onListen = () => {
          let address =
            process.env.HOST ||
            Object.values(os.networkInterfaces())
              .flat()
              .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

          if (!address) {
            console.log(`Remix App Server started at http://localhost:${port}`);
          } else {
            console.log(
              `Remix App Server started at http://localhost:${port} (http://${address}:${port})`
            );
          }
        };

        server = process.env.HOST
          ? app.listen(port, process.env.HOST, onListen)
          : app.listen(port, onListen);
      },
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
