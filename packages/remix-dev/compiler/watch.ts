import chokidar from "chokidar";
import debounce from "lodash.debounce";
import * as path from "node:path";

import type { RemixConfig } from "../config";
import { readConfig } from "../config";
import * as Compiler from "./compiler";
import type { Context } from "./context";
import { logThrown } from "./utils/log";
import { normalizeSlashes } from "../config/routes";
import type { Manifest } from "../manifest";

function isEntryPoint(config: RemixConfig, file: string): boolean {
  let configFile = path.join(config.rootDirectory, "remix.config.js");
  let appFile = path.relative(config.appDirectory, file);
  let entryPoints = [
    configFile,
    config.entryClientFile,
    config.entryServerFile,
    ...Object.values(config.routes).map((route) => route.file),
  ];
  let normalized = normalizeSlashes(appFile);
  return entryPoints.includes(normalized);
}

export type WatchOptions = {
  reloadConfig?(root: string): Promise<RemixConfig>;
  onBuildStart?(ctx: Context): void;
  onBuildManifest?(manifest: Manifest): void;
  onBuildFinish?(ctx: Context, durationMs: number, ok: boolean): void;
  onFileCreated?(file: string): void;
  onFileChanged?(file: string): void;
  onFileDeleted?(file: string): void;
};

function shouldIgnore(file: string): boolean {
  let filename = path.basename(file);
  return filename === ".DS_Store";
}

export async function watch(
  ctx: Context,
  {
    reloadConfig = readConfig,
    onBuildStart,
    onBuildManifest,
    onBuildFinish,
    onFileCreated,
    onFileChanged,
    onFileDeleted,
  }: WatchOptions = {}
): Promise<() => Promise<void>> {
  let start = Date.now();
  let compiler = await Compiler.create(ctx);
  let compile = () =>
    compiler.compile({ onManifest: onBuildManifest }).catch((thrown) => {
      if (
        thrown instanceof Error &&
        thrown.message === "The service is no longer running"
      ) {
        ctx.logger.error("esbuild is no longer running", {
          details: [
            "Most likely, your machine ran out of memory and killed the esbuild process",
            "that `remix dev` relies on for builds and rebuilds.",
          ],
        });
        process.exit(1);
      }
      logThrown(thrown);
      return undefined;
    });

  // initial build
  onBuildStart?.(ctx);
  let manifest = await compile();
  onBuildFinish?.(ctx, Date.now() - start, manifest !== undefined);

  let restart = debounce(async () => {
    let start = Date.now();
    void compiler.dispose();

    try {
      ctx.config = await reloadConfig(ctx.config.rootDirectory);
    } catch (thrown: unknown) {
      logThrown(thrown);
      return;
    }
    onBuildStart?.(ctx);

    compiler = await Compiler.create(ctx);
    let manifest = await compile();
    onBuildFinish?.(ctx, Date.now() - start, manifest !== undefined);
  }, 500);

  let rebuild = debounce(async () => {
    await compiler.cancel();
    onBuildStart?.(ctx);
    let start = Date.now();
    let manifest = await compile();
    onBuildFinish?.(ctx, Date.now() - start, manifest !== undefined);
  }, 100);

  let remixConfigPath = path.join(ctx.config.rootDirectory, "remix.config.js");
  let toWatch = [remixConfigPath, ctx.config.appDirectory];

  // WARNING: Chokidar returns different paths in change events depending on
  // whether the path provided to the watcher is absolute or relative. If the
  // path is absolute, change events will contain absolute paths, and the
  // opposite for relative paths. We need to ensure that the paths we provide
  // are always absolute to ensure consistency in change events.
  if (ctx.config.serverEntryPoint) {
    toWatch.push(
      path.resolve(ctx.config.rootDirectory, ctx.config.serverEntryPoint)
    );
  }
  ctx.config.watchPaths?.forEach((watchPath) => {
    toWatch.push(path.resolve(ctx.config.rootDirectory, watchPath));
  });

  let watcher = chokidar
    .watch(toWatch, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    })
    .on("error", (error) => ctx.logger.error(String(error)))
    .on("change", async (file) => {
      if (shouldIgnore(file)) return;
      onFileChanged?.(file);
      await (file === remixConfigPath ? restart : rebuild)();
    })
    .on("add", async (file) => {
      if (shouldIgnore(file)) return;
      onFileCreated?.(file);

      try {
        ctx.config = await reloadConfig(ctx.config.rootDirectory);
      } catch (thrown: unknown) {
        logThrown(thrown);
        return;
      }

      await (isEntryPoint(ctx.config, file) ? restart : rebuild)();
    })
    .on("unlink", async (file) => {
      if (shouldIgnore(file)) return;
      onFileDeleted?.(file);
      await (isEntryPoint(ctx.config, file) ? restart : rebuild)();
    });

  return async () => {
    await watcher.close().catch(() => undefined);
    void compiler.dispose();
  };
}
