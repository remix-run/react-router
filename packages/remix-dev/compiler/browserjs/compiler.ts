import * as path from "path";
import { builtinModules as nodeBuiltins } from "module";
import * as esbuild from "esbuild";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

import type { RemixConfig } from "../../config";
import { type Manifest } from "../../manifest";
import { getAppDependencies } from "../../dependencies";
import { loaders } from "../utils/loaders";
import type { CompileOptions } from "../options";
import { browserRouteModulesPlugin } from "./plugins/routes";
import { browserRouteModulesPlugin as browserRouteModulesPlugin_v2 } from "./plugins/routes_unstable";
import { cssFilePlugin } from "../plugins/cssImports";
import { deprecatedRemixPackagePlugin } from "../plugins/deprecatedRemixPackage";
import { emptyModulesPlugin } from "../plugins/emptyModules";
import { mdxPlugin } from "../plugins/mdx";
import { externalPlugin } from "../plugins/external";
import { cssBundleUpdatePlugin } from "./plugins/cssBundleUpdate";
import { cssModulesPlugin } from "../plugins/cssModuleImports";
import { cssSideEffectImportsPlugin } from "../plugins/cssSideEffectImports";
import { vanillaExtractPlugin } from "../plugins/vanillaExtract";
// import {
//   cssBundleEntryModulePlugin,
//   cssBundleEntryModuleId,
// } from "../plugins/cssBundleEntryModulePlugin";
import invariant from "../../invariant";
import { hmrPlugin } from "./plugins/hmr";
import { createMatchPath } from "../utils/tsconfig";
import { getPreferredPackageManager } from "../../cli/getPreferredPackageManager";

type Compiler = {
  // produce ./public/build/
  compile: () => Promise<{
    metafile: esbuild.Metafile;
    hmr?: Manifest["hmr"];
  }>;
  dispose: () => void;
};

function getNpmPackageName(id: string): string {
  let split = id.split("/");
  let packageName = split[0];
  if (packageName.startsWith("@")) packageName += `/${split[1]}`;
  return packageName;
}

function isBareModuleId(id: string): boolean {
  return !id.startsWith("node:") && !id.startsWith(".") && !path.isAbsolute(id);
}

function isNodeBuiltIn(packageName: string) {
  return nodeBuiltins.includes(packageName);
}

const getExternals = (remixConfig: RemixConfig): string[] => {
  // For the browser build, exclude node built-ins that don't have a
  // browser-safe alternative installed in node_modules. Nothing should
  // *actually* be external in the browser build (we want to bundle all deps) so
  // this is really just making sure we don't accidentally have any dependencies
  // on node built-ins in browser bundles.
  let dependencies = Object.keys(getAppDependencies(remixConfig));
  let fakeBuiltins = nodeBuiltins.filter((mod) => dependencies.includes(mod));

  if (fakeBuiltins.length > 0) {
    throw new Error(
      `It appears you're using a module that is built in to node, but you installed it as a dependency which could cause problems. Please remove ${fakeBuiltins.join(
        ", "
      )} before continuing.`
    );
  }
  return nodeBuiltins.filter((mod) => !dependencies.includes(mod));
};

const isCssBundlingEnabled = (config: RemixConfig): boolean =>
  Boolean(
    config.future.unstable_cssModules ||
      config.future.unstable_cssSideEffectImports ||
      config.future.unstable_vanillaExtract
  );

const createEsbuildConfig = (
  build: "app" | "css",
  config: RemixConfig,
  options: CompileOptions,
  onLoader: (filename: string, code: string) => void,
  readCssBundleHref: () => Promise<string | undefined>
): esbuild.BuildOptions | esbuild.BuildIncremental => {
  let isCssBuild = build === "css";
  let entryPoints: Record<string, string>;

  if (isCssBuild) {
    entryPoints = {
      // "css-bundle": cssBundleEntryModuleId,
    };
  } else {
    entryPoints = {
      "entry.client": config.entryClientFilePath,
    };

    for (let id of Object.keys(config.routes)) {
      // All route entry points are virtual modules that will be loaded by the
      // browserEntryPointsPlugin. This allows us to tree-shake server-only code
      // that we don't want to run in the browser (i.e. action & loader).
      entryPoints[id] = config.routes[id].file + "?browser";
    }
  }

  let { mode } = options;
  let outputCss = isCssBuild;

  let matchPath = config.tsconfigPath
    ? createMatchPath(config.tsconfigPath)
    : undefined;
  function resolvePath(id: string) {
    if (!matchPath) {
      return id;
    }
    return (
      matchPath(id, undefined, undefined, [".ts", ".tsx", ".js", ".jsx"]) || id
    );
  }

  let plugins: esbuild.Plugin[] = [
    deprecatedRemixPackagePlugin(options.onWarning),
    // isCssBundlingEnabled(config) && isCssBuild
    //   ? cssBundleEntryModulePlugin(config)
    //   : null,
    config.future.unstable_cssModules
      ? cssModulesPlugin({ config, mode, outputCss })
      : null,
    config.future.unstable_vanillaExtract
      ? vanillaExtractPlugin({ config, mode, outputCss })
      : null,
    config.future.unstable_cssSideEffectImports
      ? cssSideEffectImportsPlugin({ config, options })
      : null,
    cssFilePlugin({ config, options }),
    externalPlugin(/^https?:\/\//, { sideEffects: false }),
    mdxPlugin(config),
    config.future.unstable_dev
      ? browserRouteModulesPlugin_v2(config, /\?browser$/, onLoader, mode)
      : browserRouteModulesPlugin(config, /\?browser$/),
    emptyModulesPlugin(config, /\.server(\.[jt]sx?)?$/),
    NodeModulesPolyfillPlugin(),
    externalPlugin(/^node:.*/, { sideEffects: false }),
    {
      // TODO: should be removed when error handling for compiler is improved
      name: "warn-on-unresolved-imports",
      setup: (build) => {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (!isBareModuleId(resolvePath(args.path))) {
            return undefined;
          }

          if (args.path === "remix:hmr") {
            return undefined;
          }

          let packageName = getNpmPackageName(args.path);
          let pkgManager = getPreferredPackageManager();
          if (
            options.onWarning &&
            !isNodeBuiltIn(packageName) &&
            !/\bnode_modules\b/.test(args.importer) &&
            // Silence spurious warnings when using Yarn PnP. Yarn PnP doesn’t use
            // a `node_modules` folder to keep its dependencies, so the above check
            // will always fail.
            (pkgManager === "npm" ||
              (pkgManager === "yarn" && process.versions.pnp == null))
          ) {
            try {
              require.resolve(args.path);
            } catch (error: unknown) {
              options.onWarning(
                `The path "${args.path}" is imported in ` +
                  `${path.relative(process.cwd(), args.importer)} but ` +
                  `"${args.path}" was not found in your node_modules. ` +
                  `Did you forget to install it?`,
                args.path
              );
            }
          }
          return undefined;
        });
      },
    } as esbuild.Plugin,
  ].filter(isNotNull);

  if (build === "app" && mode === "development" && config.future.unstable_dev) {
    // TODO prebundle deps instead of chunking just these ones
    let isolateChunks = [
      require.resolve("react"),
      require.resolve("react/jsx-dev-runtime"),
      require.resolve("react/jsx-runtime"),
      require.resolve("react-dom"),
      require.resolve("react-dom/client"),
      require.resolve("react-refresh/runtime"),
      require.resolve("@remix-run/react"),
      "remix:hmr",
    ];
    entryPoints = {
      ...entryPoints,
      ...Object.fromEntries(isolateChunks.map((imprt) => [imprt, imprt])),
    };

    plugins.push(hmrPlugin({ remixConfig: config }));

    if (isCssBundlingEnabled(config)) {
      plugins.push(
        cssBundleUpdatePlugin({ getCssBundleHref: readCssBundleHref })
      );
    }
  }

  return {
    entryPoints,
    outdir: config.assetsBuildDirectory,
    platform: "browser",
    format: "esm",
    external: [
      // This allows Vanilla Extract to bundle asset imports, e.g. `import href
      // from './image.svg'` resolves to a string like "/build/_assets/XXXX.svg"
      // which will then appear in the compiled CSS, e.g. `background:
      // url("/build/_assets/XXXX.svg")`. If we don't mark this path as
      // external, esbuild will try to bundle it again but won't find it.
      config.future.unstable_vanillaExtract
        ? `${config.publicPath}_assets/*`
        : null,
      ...getExternals(config),
    ].filter(isNotNull),
    loader: loaders,
    bundle: true,
    logLevel: "silent",
    splitting: !isCssBuild,
    sourcemap: options.sourcemap,
    // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
    // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
    // behavior can only be avoided by creating an empty tsconfig file in the root directory.
    tsconfig: config.tsconfigPath,
    mainFields: ["browser", "module", "main"],
    treeShaking: true,
    minify: options.mode === "production",
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    publicPath: config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(options.mode),
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        config.devServerPort
      ),
    },
    jsx: "automatic",
    jsxDev: options.mode !== "production",
    plugins,
    supported: {
      "import-meta": true,
    },
  };
};

export const create = (
  remixConfig: RemixConfig,
  options: CompileOptions,
  readCssBundleHref: () => Promise<string | undefined>
): Compiler => {
  let appCompiler: esbuild.BuildIncremental;

  let hmrRoutes: Record<string, { loaderHash: string }> = {};
  let onLoader = (filename: string, code: string) => {
    let key = path.relative(remixConfig.rootDirectory, filename);
    hmrRoutes[key] = { loaderHash: code };
  };

  let compile = async () => {
    hmrRoutes = {};
    let appBuildTask = async () => {
      appCompiler = await (!appCompiler
        ? esbuild.build({
            ...createEsbuildConfig(
              "app",
              remixConfig,
              options,
              onLoader,
              readCssBundleHref
            ),
            metafile: true,
            incremental: true,
          })
        : appCompiler.rebuild());

      invariant(
        appCompiler.metafile,
        "Expected app compiler metafile to be defined. This is likely a bug in Remix. Please open an issue at https://github.com/remix-run/remix/issues/new"
      );
      return appCompiler.metafile;
    };

    let metafile = await appBuildTask();

    let hmr: Manifest["hmr"] | undefined = undefined;
    if (options.mode === "development" && remixConfig.future.unstable_dev) {
      let hmrRuntimeOutput = Object.entries(metafile.outputs).find(
        ([_, output]) => output.inputs["hmr-runtime:remix:hmr"]
      )?.[0];
      invariant(hmrRuntimeOutput, "Expected to find HMR runtime in outputs");
      let hmrRuntime =
        remixConfig.publicPath +
        path.relative(
          remixConfig.assetsBuildDirectory,
          path.resolve(hmrRuntimeOutput)
        );
      hmr = {
        runtime: hmrRuntime,
        routes: hmrRoutes,
        timestamp: Date.now(),
      };
    }

    return { metafile, hmr };
  };

  return {
    compile,
    dispose: () => appCompiler?.rebuild.dispose(),
  };
};

function isNotNull<Value>(value: Value): value is Exclude<Value, null> {
  return value !== null;
}
