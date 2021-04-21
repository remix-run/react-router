////////////////////////////////////////////////////////////////////////////////
// In 0.17
//
// - fn run3() -> fn run()
// - fn watch2() -> fn dev()
// - fn build2() -> fn build()
import * as path from "path";
import signalExit from "signal-exit";
import prettyMs from "pretty-ms";
import { BuildMode, isBuildMode, BuildTarget } from "../build";
import * as compiler from "../compiler";
import * as compiler2 from "../compiler2";
import { readConfig } from "../config";
import type { RemixConfig } from "../config";
import { startDevServer } from "../server";
import WebSocket from "ws";

/**
 * Runs the build for a Remix app with the old rollup compiler
 */
export async function build(remixRoot: string, mode?: string) {
  let buildMode = isBuildMode(mode) ? mode : BuildMode.Production;

  console.log(`Building Remix app for ${buildMode}...`);

  let config = await readConfig(remixRoot);

  await Promise.all([
    compiler.write(
      await compiler.build(config, {
        mode: buildMode,
        target: BuildTarget.Server
      }),
      config.serverBuildDirectory
    ),
    compiler.write(
      await compiler.build(config, {
        mode: buildMode,
        target: BuildTarget.Browser
      }),
      config.assetsBuildDirectory
    )
  ]);

  console.log("done!");
}

/**
 * Runs the old rollup dev watcher.
 */
export async function run(remixRoot: string) {
  let config = await readConfig(remixRoot);

  startDevServer(config, {
    onListen() {
      console.log(
        `Remix dev server running on port ${config.devServerPort}...`
      );
    }
  });
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Runs the new esbuild compiler
 */
export async function build2(
  remixRoot: string,
  modeArg?: string
): Promise<void> {
  let mode = isBuildMode(modeArg) ? modeArg : BuildMode.Production;

  console.log(`Building Remix app in ${mode} mode...`);

  let start = Date.now();
  let config = await readConfig(remixRoot);
  await compiler2.build(config, { mode: mode });

  console.log(`Built in ${prettyMs(Date.now() - start)}`);
}

/**
 * Watches with the new esbuild compiler
 */
export async function watch2(
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

  let wss = new WebSocket.Server({ port: 3001 });
  function broadcast(event: { type: string; [key: string]: any }) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  }

  function log(_message: string) {
    let message = `💿 ${_message}`;
    console.log(message);
    broadcast({ type: "LOG", message });
  }

  signalExit(
    await compiler2.watch(config, {
      mode,
      // TODO: esbuild compiler just blows up on syntax errors in the app
      // onError(errorMessage) {
      //   console.error(errorMessage);
      // },
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

  console.log(`💿 Built in ${prettyMs(Date.now() - start)}`);
}

export function run2(remixRoot: string): Promise<void> {
  return watch2(remixRoot);
}

/**
 * Runs the built-in remix app server and dev asset server
 */
export async function run3(remixRoot: string) {
  if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
  let config = await readConfig(remixRoot);
  let getAppServer = require("@remix-run/serve/app");
  let port = process.env.PORT || 3000;

  getAppServer(config.serverBuildDirectory).listen(port, () => {
    console.log(`Remix App Server started at http://localhost:${port}`);
  });

  watch2(config, BuildMode.Development, () => {
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
