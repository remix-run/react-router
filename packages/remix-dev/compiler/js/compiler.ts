import * as path from "path";
import { builtinModules as nodeBuiltins } from "module";
import * as esbuild from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";

import type { RemixConfig } from "../../config";
import { type Manifest } from "../../manifest";
import { getAppDependencies } from "../../dependencies";
import { loaders } from "../utils/loaders";
import { browserRouteModulesPlugin } from "./plugins/routes";
import { cssFilePlugin } from "../plugins/cssImports";
import { absoluteCssUrlsPlugin } from "../plugins/absoluteCssUrlsPlugin";
import { deprecatedRemixPackagePlugin } from "../plugins/deprecatedRemixPackage";
import { emptyModulesPlugin } from "../plugins/emptyModules";
import { mdxPlugin } from "../plugins/mdx";
import { externalPlugin } from "../plugins/external";
import { cssBundlePlugin } from "../plugins/cssBundlePlugin";
import { cssModulesPlugin } from "../plugins/cssModuleImports";
import { cssSideEffectImportsPlugin } from "../plugins/cssSideEffectImports";
import { vanillaExtractPlugin } from "../plugins/vanillaExtract";
import invariant from "../../invariant";
import { hmrPlugin } from "./plugins/hmr";
import type { LazyValue } from "../lazyValue";
import type { Context } from "../context";
import { writeMetafile } from "../analysis";

type Compiler = {
  // produce ./public/build/
  compile: () => Promise<{
    metafile: esbuild.Metafile;
    hmr?: Manifest["hmr"];
  }>;
  cancel: () => Promise<void>;
  dispose: () => Promise<void>;
};

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

const createEsbuildConfig = (
  ctx: Context,
  refs: { lazyCssBundleHref: LazyValue<string | undefined> }
): esbuild.BuildOptions => {
  let entryPoints: Record<string, string> = {
    "entry.client": ctx.config.entryClientFilePath,
  };

  for (let id of Object.keys(ctx.config.routes)) {
    entryPoints[id] = ctx.config.routes[id].file;
    // All route entry points are virtual modules that will be loaded by the
    // browserEntryPointsPlugin. This allows us to tree-shake server-only code
    // that we don't want to run in the browser (i.e. action & loader).
    entryPoints[id] += "?browser";
  }

  if (
    ctx.options.mode === "development" &&
    ctx.config.future.v2_dev !== false
  ) {
    let defaultsDirectory = path.resolve(
      __dirname,
      "..",
      "..",
      "config",
      "defaults"
    );
    entryPoints["__remix_entry_dev"] = path.join(
      defaultsDirectory,
      "entry.dev.ts"
    );
  }

  let plugins: esbuild.Plugin[] = [
    browserRouteModulesPlugin(ctx, /\?browser$/),
    deprecatedRemixPackagePlugin(ctx),
    cssBundlePlugin(refs),
    cssModulesPlugin(ctx, { outputCss: false }),
    vanillaExtractPlugin(ctx, { outputCss: false }),
    cssSideEffectImportsPlugin(ctx, {
      hmr:
        ctx.options.mode === "development" &&
        ctx.config.future.v2_dev !== false,
    }),
    cssFilePlugin(ctx),
    absoluteCssUrlsPlugin(),
    externalPlugin(/^https?:\/\//, { sideEffects: false }),
    mdxPlugin(ctx),
    emptyModulesPlugin(ctx, /\.server(\.[jt]sx?)?$/),
    emptyModulesPlugin(ctx, /^@remix-run\/(deno|cloudflare|node)(\/.*)?$/, {
      includeNodeModules: true,
    }),
    nodeModulesPolyfillPlugin(),
    externalPlugin(/^node:.*/, { sideEffects: false }),
  ];

  if (ctx.options.mode === "development" && ctx.config.future.v2_dev) {
    plugins.push(hmrPlugin(ctx));
  }

  return {
    entryPoints,
    outdir: ctx.config.assetsBuildDirectory,
    platform: "browser",
    format: "esm",
    external: getExternals(ctx.config),
    loader: loaders,
    bundle: true,
    logLevel: "silent",
    splitting: true,
    sourcemap: ctx.options.sourcemap,
    // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
    // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
    // behavior can only be avoided by creating an empty tsconfig file in the root directory.
    tsconfig: ctx.config.tsconfigPath,
    mainFields: ["browser", "module", "main"],
    treeShaking: true,
    minify: ctx.options.mode === "production",
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    publicPath: ctx.config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(ctx.options.mode),
      "process.env.REMIX_DEV_ORIGIN": JSON.stringify(
        ctx.options.REMIX_DEV_ORIGIN ?? ""
      ),
      // TODO: remove in v2
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        ctx.config.devServerPort
      ),
      ...(ctx.options.mode === "production"
        ? {
            "import.meta.hot": "undefined",
          }
        : {}),
    },
    jsx: "automatic",
    jsxDev: ctx.options.mode !== "production",
    plugins,
    supported: {
      "import-meta": true,
    },
  };
};

export const create = async (
  ctx: Context,
  refs: { lazyCssBundleHref: LazyValue<string | undefined> }
): Promise<Compiler> => {
  let compiler = await esbuild.context({
    ...createEsbuildConfig(ctx, refs),
    metafile: true,
  });

  let compile = async () => {
    let { metafile } = await compiler.rebuild();
    writeMetafile(ctx, "metafile.js.json", metafile);

    let hmr: Manifest["hmr"] | undefined = undefined;
    if (ctx.options.mode === "development" && ctx.config.future.v2_dev) {
      let hmrRuntimeOutput = Object.entries(metafile.outputs).find(
        ([_, output]) => output.inputs["hmr-runtime:remix:hmr"]
      )?.[0];
      invariant(hmrRuntimeOutput, "Expected to find HMR runtime in outputs");
      let hmrRuntime =
        ctx.config.publicPath +
        path.relative(
          ctx.config.assetsBuildDirectory,
          path.resolve(hmrRuntimeOutput)
        );
      hmr = {
        runtime: hmrRuntime,
        timestamp: Date.now(),
      };
    }

    return { metafile, hmr };
  };

  return {
    compile,
    cancel: compiler.cancel,
    dispose: compiler.dispose,
  };
};
