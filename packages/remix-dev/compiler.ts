import fs from "fs";
import path from "path";
import type {
  ExternalOption,
  InputOption,
  InputOptions,
  OutputOptions,
  Plugin,
  RollupBuild,
  RollupError,
  RollupOutput,
  TreeshakingOptions
} from "rollup";
import * as rollup from "rollup";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

import { BuildMode, BuildTarget } from "./build";
import type { RemixConfig } from "./config";
import { isImportHint } from "./compiler/importHints";
import { ignorePackages } from "./compiler/browserIgnore";

import assetsManifest from "./compiler/rollup/assetsManifest";
import clientServer from "./compiler/rollup/clientServer";
import css from "./compiler/rollup/css";
import img from "./compiler/rollup/img";
import mdx from "./compiler/rollup/mdx";
import remixConfig from "./compiler/rollup/remixConfig";
import remixInputs from "./compiler/rollup/remixInputs";
import routeModules from "./compiler/rollup/routeModules";
import serverManifest from "./compiler/rollup/serverManifest";
import url from "./compiler/rollup/url";
import watchDirectory from "./compiler/rollup/watchDirectory";

export interface RemixBuild extends RollupBuild {
  options: Required<BuildOptions>;
}

export function createBuild(
  rollupBuild: RollupBuild,
  options: Required<BuildOptions>
): RemixBuild {
  let build = (rollupBuild as unknown) as RemixBuild;
  build.options = options;
  return build;
}

export interface BuildOptions {
  mode?: BuildMode;
  target?: BuildTarget;
}

/**
 * Runs the build.
 */
export async function build(
  config: RemixConfig,
  {
    mode = BuildMode.Production,
    target = BuildTarget.Server
  }: BuildOptions = {}
): Promise<RemixBuild> {
  let buildOptions = { mode, target };
  let plugins = [
    remixConfig({ rootDir: config.rootDirectory }),
    ...getBuildPlugins(buildOptions)
  ];

  let rollupBuild = await rollup.rollup({
    external: getExternalOption(target),
    treeshake: getTreeshakeOption(target),
    onwarn: getOnWarnOption(target),
    plugins
  });

  return createBuild(rollupBuild, buildOptions);
}

export interface WatchOptions extends BuildOptions {
  onBuildStart?: () => void;
  onBuildEnd?: (build: RemixBuild) => void;
  onError?: (error: RollupError) => void;
}

/**
 * Runs the build in watch mode.
 */
export function watch(
  config: RemixConfig,
  {
    mode = BuildMode.Development,
    target = BuildTarget.Browser,
    onBuildStart,
    onBuildEnd,
    onError
  }: WatchOptions = {}
): () => void {
  let buildOptions = { mode, target };
  let plugins = [
    remixConfig({ rootDir: config.rootDirectory }),
    // Watch for newly created route files.
    watchDirectory({ dir: config.appDirectory }),
    ...getBuildPlugins(buildOptions)
  ];

  let watcher = rollup.watch({
    external: getExternalOption(target),
    treeshake: getTreeshakeOption(target),
    onwarn: getOnWarnOption(target),
    plugins,
    watch: {
      buildDelay: 100,
      // Skip the write here and do it in a callback instead. This gives us
      // a more consistent interface between `build` and `watch`. Both of them
      // give you access to the raw build and let you do the generate/write
      // step separately.
      skipWrite: true
    }
  });

  watcher.on("event", async event => {
    if (event.code === "ERROR") {
      if (onError) {
        onError(event.error);
      } else {
        console.error(event.error);
      }
    } else if (event.code === "BUNDLE_START") {
      if (onBuildStart) onBuildStart();
    } else if (event.code === "BUNDLE_END") {
      if (onBuildEnd) {
        let rollupBuild = event.result;
        onBuildEnd(createBuild(rollupBuild, buildOptions));
      }
    }
  });

  return () => {
    watcher.close();
  };
}

/**
 * Creates an in-memory build. This is useful in both the asset server and the
 * main server in dev mode to avoid writing the builds to disk.
 */
export function generate(build: RemixBuild): Promise<RollupOutput> {
  return build.generate(getOutputOptions(build));
}

/**
 * Writes the build to disk.
 */
export function write(build: RemixBuild, dir: string): Promise<RollupOutput> {
  return build.write({ ...getOutputOptions(build), dir });
}

////////////////////////////////////////////////////////////////////////////////

function isLocalModuleId(id: string): boolean {
  return (
    // This is a relative id that hasn't been resolved yet, e.g. "./App"
    id.startsWith(".") ||
    // This is an absolute filesystem path that has already been resolved, e.g.
    // "/path/to/node_modules/react/index.js"
    path.isAbsolute(id)
  );
}

function getExternalOption(target: string): ExternalOption | undefined {
  return target === BuildTarget.Server
    ? (id: string) =>
        // We need to bundle @remix-run/react since it is ESM and we
        // are building CommonJS output.
        id !== "@remix-run/react" &&
        // Exclude non-local module identifiers from the server bundles.
        // This includes identifiers like "react" which will be resolved
        // dynamically at runtime using require().
        !isLocalModuleId(id) &&
        !isImportHint(id)
    : // Exclude packages we know we don't want in the browser bundles.
      // These *should* be stripped from the browser bundles anyway when
      // tree-shaking kicks in, so making them external just saves Rollup
      // some time having to load and parse them and their dependencies.
      ignorePackages;
}

function getInputOption(config: RemixConfig, target: BuildTarget): InputOption {
  let input: InputOption = {};

  if (target === BuildTarget.Browser) {
    input["entry.client"] = path.resolve(
      config.appDirectory,
      config.entryClientFile
    );
  } else if (target === BuildTarget.Server) {
    input["entry.server"] = path.resolve(
      config.appDirectory,
      config.entryServerFile
    );
  }

  for (let key of Object.keys(config.routes)) {
    let route = config.routes[key];
    input[route.id] = path.resolve(config.appDirectory, route.file);
  }

  return input;
}

function getTreeshakeOption(
  target: BuildTarget
): TreeshakingOptions | undefined {
  return target === BuildTarget.Browser
    ? // When building for the browser, we need to be very aggressive with code
      // removal so we can be sure all imports of server-only code are removed.
      {
        moduleSideEffects(id) {
          // Allow node_modules to have side effects. Everything else (all app
          // modules) should be pure. This allows weird dependencies like
          // "firebase/auth" to have side effects.
          return /\bnode_modules\b/.test(id);
        }
      }
    : undefined;
}

function getOnWarnOption(
  target: BuildTarget
): InputOptions["onwarn"] | undefined {
  return target === BuildTarget.Browser
    ? (warning, warn) => {
        if (warning.code === "EMPTY_BUNDLE") {
          // Ignore "Generated an empty chunk: blah" warnings when building for
          // the browser. There may be quite a few of them because we are
          // aggressively removing server-only packages from the build.
          // TODO: Can we get Rollup to avoid generating these chunks entirely?
          return;
        }

        warn(warning);
      }
    : undefined;
}

function getBuildPlugins({ mode, target }: Required<BuildOptions>): Plugin[] {
  let plugins: Plugin[] = [
    remixInputs({
      getInput(config) {
        return getInputOption(config, target);
      }
    })
  ];

  plugins.push(
    clientServer({ target }),
    mdx(),
    routeModules({ target }),
    json(),
    img({ target }),
    css({ target, mode }),
    url({ target }),
    babel({
      babelHelpers: "bundled",
      configFile: false,
      exclude: /node_modules/,
      extensions: [".md", ".mdx", ".js", ".jsx", ".ts", ".tsx"],
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        // TODO: Different targets for browsers vs. node.
        ["@babel/preset-env", { bugfixes: true, targets: { node: "12" } }],
        [
          "@babel/preset-typescript",
          {
            allExtensions: true,
            isTSX: true
          }
        ]
      ]
    }),
    nodeResolve({
      browser: target === BuildTarget.Browser,
      extensions: [".js", ".json", ".jsx", ".ts", ".tsx"],
      preferBuiltins: target !== BuildTarget.Browser
    }),
    commonjs()
  );

  if (target !== BuildTarget.Server) {
    plugins.push(
      replace({
        preventAssignment: true,
        values: {
          "process.env.NODE_ENV": JSON.stringify(mode)
        }
      })
    );
  }

  if (target !== BuildTarget.Server && mode === BuildMode.Production) {
    plugins.push(terser({ ecma: 2017 }));
  }

  if (target === BuildTarget.Browser) {
    plugins.push(assetsManifest());
  } else if (target === BuildTarget.Server) {
    plugins.push(serverManifest());
  }

  return plugins;
}

function getOutputOptions(build: RemixBuild): OutputOptions {
  let { mode, target } = build.options;

  return {
    format: target === BuildTarget.Server ? "cjs" : "esm",
    exports: target === BuildTarget.Server ? "named" : undefined,
    assetFileNames:
      mode === BuildMode.Production && target === BuildTarget.Browser
        ? "[name]-[hash][extname]"
        : "[name][extname]",
    chunkFileNames: "_shared/[name]-[hash].js",
    entryFileNames:
      mode === BuildMode.Production && target === BuildTarget.Browser
        ? "[name]-[hash].js"
        : "[name].js",
    manualChunks(id) {
      return getNpmPackageName(id);
    }
  };
}

function getNpmPackageName(id: string): string | undefined {
  let pieces = id.split(path.sep);
  let index = pieces.lastIndexOf("node_modules");

  if (index !== -1 && pieces.length > index + 1) {
    let packageName = pieces[index + 1];

    if (packageName.startsWith("@") && pieces.length > index + 2) {
      packageName =
        // S3 hates @folder, so we switch it to __
        packageName.replace("@", "__") + "/" + pieces[index + 2];
    }

    return packageName;
  }

  return undefined;
}
