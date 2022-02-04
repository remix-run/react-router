import * as path from "path";
import { builtinModules as nodeBuiltins } from "module";
import * as esbuild from "esbuild";
import * as fse from "fs-extra";
import debounce from "lodash.debounce";
import chokidar from "chokidar";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

import { BuildMode, BuildTarget } from "./build";
import type { RemixConfig } from "./config";
import { readConfig } from "./config";
import { warnOnce } from "./warnings";
import type { AssetsManifest } from "./compiler/assets";
import { createAssetsManifest } from "./compiler/assets";
import { getAppDependencies } from "./compiler/dependencies";
import { loaders } from "./compiler/loaders";
import { browserRouteModulesPlugin } from "./compiler/plugins/browserRouteModulesPlugin";
import { emptyModulesPlugin } from "./compiler/plugins/emptyModulesPlugin";
import { mdxPlugin } from "./compiler/plugins/mdx";
import type { AssetsManifestPromiseRef } from "./compiler/plugins/serverAssetsManifestPlugin";
import { serverAssetsManifestPlugin } from "./compiler/plugins/serverAssetsManifestPlugin";
import { serverBareModulesPlugin } from "./compiler/plugins/serverBareModulesPlugin";
import { serverEntryModulePlugin } from "./compiler/plugins/serverEntryModulePlugin";
import { serverRouteModulesPlugin } from "./compiler/plugins/serverRouteModulesPlugin";
import { writeFileSafe } from "./compiler/utils/fs";

// When we build Remix, this shim file is copied directly into the output
// directory in the same place relative to this file. It is eventually injected
// as a source file when building the app.
const reactShim = path.resolve(__dirname, "compiler/shims/react.ts");

interface BuildConfig {
  mode: BuildMode;
  target: BuildTarget;
  sourcemap: boolean;
}

function defaultWarningHandler(message: string, key: string) {
  warnOnce(false, message, key);
}

function defaultBuildFailureHandler(failure: Error | esbuild.BuildFailure) {
  if ("warnings" in failure || "errors" in failure) {
    if (failure.warnings) {
      let messages = esbuild.formatMessagesSync(failure.warnings, {
        kind: "warning",
        color: true
      });
      console.warn(...messages);
    }

    if (failure.errors) {
      let messages = esbuild.formatMessagesSync(failure.errors, {
        kind: "error",
        color: true
      });
      console.error(...messages);
    }
  }

  console.error(failure?.message || "An unknown build error occurred");
}

interface BuildOptions extends Partial<BuildConfig> {
  onWarning?(message: string, key: string): void;
  onBuildFailure?(failure: Error | esbuild.BuildFailure): void;
}

export async function build(
  config: RemixConfig,
  {
    mode = BuildMode.Production,
    target = BuildTarget.Node14,
    sourcemap = false,
    onWarning = defaultWarningHandler,
    onBuildFailure = defaultBuildFailureHandler
  }: BuildOptions = {}
): Promise<void> {
  let assetsManifestPromiseRef: AssetsManifestPromiseRef = {};

  await buildEverything(config, assetsManifestPromiseRef, {
    mode,
    target,
    sourcemap,
    onWarning,
    onBuildFailure
  });
}

interface WatchOptions extends BuildOptions {
  onRebuildStart?(): void;
  onRebuildFinish?(): void;
  onFileCreated?(file: string): void;
  onFileChanged?(file: string): void;
  onFileDeleted?(file: string): void;
  onInitialBuild?(): void;
}

export async function watch(
  config: RemixConfig,
  {
    mode = BuildMode.Development,
    target = BuildTarget.Node14,
    sourcemap = true,
    onWarning = defaultWarningHandler,
    onBuildFailure = defaultBuildFailureHandler,
    onRebuildStart,
    onRebuildFinish,
    onFileCreated,
    onFileChanged,
    onFileDeleted,
    onInitialBuild
  }: WatchOptions = {}
): Promise<() => Promise<void>> {
  let options = {
    mode,
    target,
    sourcemap,
    onBuildFailure,
    onWarning,
    incremental: true
  };

  let assetsManifestPromiseRef: AssetsManifestPromiseRef = {};
  let [browserBuild, serverBuild] = await buildEverything(
    config,
    assetsManifestPromiseRef,
    options
  );

  let initialBuildComplete = !!browserBuild && !!serverBuild;
  if (initialBuildComplete) {
    onInitialBuild?.();
  }

  function disposeBuilders() {
    browserBuild?.rebuild?.dispose();
    serverBuild?.rebuild?.dispose();
    browserBuild = undefined;
    serverBuild = undefined;
  }

  let restartBuilders = debounce(async (newConfig?: RemixConfig) => {
    disposeBuilders();
    try {
      newConfig = await readConfig(config.rootDirectory);
    } catch (error) {
      onBuildFailure(error as Error);
      return;
    }

    config = newConfig;
    if (onRebuildStart) onRebuildStart();
    let builders = await buildEverything(
      config,
      assetsManifestPromiseRef,
      options
    );
    if (onRebuildFinish) onRebuildFinish();
    browserBuild = builders[0];
    serverBuild = builders[1];
  }, 500);

  let rebuildEverything = debounce(async () => {
    if (onRebuildStart) onRebuildStart();

    if (!browserBuild?.rebuild || !serverBuild?.rebuild) {
      disposeBuilders();

      try {
        [browserBuild, serverBuild] = await buildEverything(
          config,
          assetsManifestPromiseRef,
          options
        );

        if (!initialBuildComplete) {
          initialBuildComplete = !!browserBuild && !!serverBuild;
          if (initialBuildComplete) {
            onInitialBuild?.();
          }
        }
        if (onRebuildFinish) onRebuildFinish();
      } catch (err: any) {
        onBuildFailure(err);
      }
      return;
    }

    // If we get here and can't call rebuild something went wrong and we
    // should probably blow as it's not really recoverable.
    let browserBuildPromise = browserBuild.rebuild();
    let assetsManifestPromise = browserBuildPromise.then(build =>
      generateAssetsManifest(config, build.metafile!)
    );

    // Assign the assetsManifestPromise to a ref so the server build can await
    // it when loading the @remix-run/dev/assets-manifest virtual module.
    assetsManifestPromiseRef.current = assetsManifestPromise;

    await Promise.all([
      assetsManifestPromise,
      serverBuild
        .rebuild()
        .then(build => writeServerBuildResult(config, build.outputFiles!))
    ]).catch(err => {
      disposeBuilders();
      onBuildFailure(err);
    });
    if (onRebuildFinish) onRebuildFinish();
  }, 100);

  let toWatch = [config.appDirectory];
  if (config.serverEntryPoint) {
    toWatch.push(config.serverEntryPoint);
  }

  let watcher = chokidar
    .watch(toWatch, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    })
    .on("error", error => console.error(error))
    .on("change", async file => {
      if (onFileChanged) onFileChanged(file);
      await rebuildEverything();
    })
    .on("add", async file => {
      if (onFileCreated) onFileCreated(file);
      let newConfig: RemixConfig;
      try {
        newConfig = await readConfig(config.rootDirectory);
      } catch (error) {
        onBuildFailure(error as Error);
        return;
      }

      if (isEntryPoint(newConfig, file)) {
        await restartBuilders(newConfig);
      } else {
        await rebuildEverything();
      }
    })
    .on("unlink", async file => {
      if (onFileDeleted) onFileDeleted(file);
      if (isEntryPoint(config, file)) {
        await restartBuilders();
      } else {
        await rebuildEverything();
      }
    });

  return async () => {
    await watcher.close().catch(() => {});
    disposeBuilders();
  };
}

function isEntryPoint(config: RemixConfig, file: string) {
  let appFile = path.relative(config.appDirectory, file);

  if (
    appFile === config.entryClientFile ||
    appFile === config.entryServerFile
  ) {
    return true;
  }
  for (let key in config.routes) {
    if (appFile === config.routes[key].file) return true;
  }

  return false;
}

///////////////////////////////////////////////////////////////////////////////

async function buildEverything(
  config: RemixConfig,
  assetsManifestPromiseRef: AssetsManifestPromiseRef,
  options: Required<BuildOptions> & { incremental?: boolean }
): Promise<(esbuild.BuildResult | undefined)[]> {
  try {
    let browserBuildPromise = createBrowserBuild(config, options);
    let assetsManifestPromise = browserBuildPromise.then(build =>
      generateAssetsManifest(config, build.metafile!)
    );

    // Assign the assetsManifestPromise to a ref so the server build can await
    // it when loading the @remix-run/dev/assets-manifest virtual module.
    assetsManifestPromiseRef.current = assetsManifestPromise;

    let serverBuildPromise = createServerBuild(
      config,
      options,
      assetsManifestPromiseRef
    );

    return await Promise.all([
      assetsManifestPromise.then(() => browserBuildPromise),
      serverBuildPromise
    ]);
  } catch (err) {
    options.onBuildFailure(err as Error);
    return [undefined, undefined];
  }
}

async function createBrowserBuild(
  config: RemixConfig,
  options: BuildOptions & { incremental?: boolean }
): Promise<esbuild.BuildResult> {
  // For the browser build, exclude node built-ins that don't have a
  // browser-safe alternative installed in node_modules. Nothing should
  // *actually* be external in the browser build (we want to bundle all deps) so
  // this is really just making sure we don't accidentally have any dependencies
  // on node built-ins in browser bundles.
  let dependencies = Object.keys(await getAppDependencies(config));
  let externals = nodeBuiltins.filter(mod => !dependencies.includes(mod));
  let fakeBuiltins = nodeBuiltins.filter(mod => dependencies.includes(mod));

  if (fakeBuiltins.length > 0) {
    throw new Error(
      `It appears you're using a module that is built in to node, but you installed it as a dependency which could cause problems. Please remove ${fakeBuiltins.join(
        ", "
      )} before continuing.`
    );
  }

  let entryPoints: esbuild.BuildOptions["entryPoints"] = {
    "entry.client": path.resolve(config.appDirectory, config.entryClientFile)
  };
  for (let id of Object.keys(config.routes)) {
    // All route entry points are virtual modules that will be loaded by the
    // browserEntryPointsPlugin. This allows us to tree-shake server-only code
    // that we don't want to run in the browser (i.e. action & loader).
    entryPoints[id] =
      path.resolve(config.appDirectory, config.routes[id].file) + "?browser";
  }

  return esbuild.build({
    entryPoints,
    outdir: config.assetsBuildDirectory,
    platform: "browser",
    format: "esm",
    external: externals,
    inject: [reactShim],
    loader: loaders,
    bundle: true,
    logLevel: "silent",
    splitting: true,
    sourcemap: options.sourcemap,
    metafile: true,
    incremental: options.incremental,
    mainFields: ["browser", "module", "main"],
    treeShaking: true,
    minify: options.mode === BuildMode.Production,
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        config.devServerPort
      )
    },
    plugins: [
      mdxPlugin(config),
      browserRouteModulesPlugin(config, /\?browser$/),
      emptyModulesPlugin(config, /\.server(\.[jt]sx?)?$/),
      NodeModulesPolyfillPlugin()
    ]
  });
}

async function createServerBuild(
  config: RemixConfig,
  options: Required<BuildOptions> & { incremental?: boolean },
  assetsManifestPromiseRef: AssetsManifestPromiseRef
): Promise<esbuild.BuildResult> {
  let dependencies = await getAppDependencies(config);

  let stdin: esbuild.StdinOptions | undefined;
  let entryPoints: string[] | undefined;

  if (config.serverEntryPoint) {
    entryPoints = [config.serverEntryPoint];
  } else {
    stdin = {
      contents: config.serverBuildTargetEntryModule,
      resolveDir: config.rootDirectory,
      loader: "ts"
    };
  }

  let plugins: esbuild.Plugin[] = [
    mdxPlugin(config),
    emptyModulesPlugin(config, /\.client\.[tj]sx?$/),
    serverRouteModulesPlugin(config),
    serverEntryModulePlugin(config),
    serverAssetsManifestPlugin(assetsManifestPromiseRef),
    serverBareModulesPlugin(config, dependencies)
  ];

  if (config.serverPlatform !== "node") {
    plugins.push(NodeModulesPolyfillPlugin());
  }

  return esbuild
    .build({
      absWorkingDir: config.rootDirectory,
      stdin,
      entryPoints,
      outfile: config.serverBuildPath,
      write: false,
      platform: config.serverPlatform,
      format: config.serverModuleFormat,
      treeShaking: true,
      minify:
        options.mode === BuildMode.Production &&
        !!config.serverBuildTarget &&
        ["cloudflare-workers", "cloudflare-pages"].includes(
          config.serverBuildTarget
        ),
      mainFields:
        config.serverModuleFormat === "esm"
          ? ["module", "main"]
          : ["main", "module"],
      target: options.target,
      inject: [reactShim],
      loader: loaders,
      bundle: true,
      logLevel: "silent",
      incremental: options.incremental,
      sourcemap: options.sourcemap ? "inline" : false,
      // The server build needs to know how to generate asset URLs for imports
      // of CSS and other files.
      assetNames: "_assets/[name]-[hash]",
      publicPath: config.publicPath,
      define: {
        "process.env.NODE_ENV": JSON.stringify(options.mode),
        "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
          config.devServerPort
        )
      },
      plugins
    })
    .then(async build => {
      await writeServerBuildResult(config, build.outputFiles);
      return build;
    });
}

async function generateAssetsManifest(
  config: RemixConfig,
  metafile: esbuild.Metafile
): Promise<AssetsManifest> {
  let assetsManifest = await createAssetsManifest(config, metafile);
  let filename = `manifest-${assetsManifest.version.toUpperCase()}.js`;

  assetsManifest.url = config.publicPath + filename;

  await writeFileSafe(
    path.join(config.assetsBuildDirectory, filename),
    `window.__remixManifest=${JSON.stringify(assetsManifest)};`
  );

  return assetsManifest;
}

async function writeServerBuildResult(
  config: RemixConfig,
  outputFiles: esbuild.OutputFile[]
) {
  await fse.ensureDir(path.dirname(config.serverBuildPath));

  for (let file of outputFiles) {
    if (file.path === config.serverBuildPath) {
      await fse.writeFile(file.path, file.contents);
      break;
    }
  }
}
