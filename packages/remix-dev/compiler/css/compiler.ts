import { builtinModules as nodeBuiltins } from "module";
import * as esbuild from "esbuild";

import type { RemixConfig } from "../../config";
import { getAppDependencies } from "../../dependencies";
import { loaders } from "../utils/loaders";
import { cssFilePlugin } from "../plugins/cssImports";
import { absoluteCssUrlsPlugin } from "../plugins/absoluteCssUrlsPlugin";
import { emptyModulesPlugin } from "../plugins/emptyModules";
import { mdxPlugin } from "../plugins/mdx";
import { externalPlugin } from "../plugins/external";
import { cssModulesPlugin } from "../plugins/cssModuleImports";
import { cssSideEffectImportsPlugin } from "../plugins/cssSideEffectImports";
import { vanillaExtractPlugin } from "../plugins/vanillaExtract";
import {
  cssBundleEntryModulePlugin,
  cssBundleEntryModuleId,
} from "./plugins/bundleEntry";
import type { Context } from "../context";
import { isBundle } from "./bundle";
import { writeMetafile } from "../analysis";

const getExternals = (config: RemixConfig): string[] => {
  // For the browser build, exclude node built-ins that don't have a
  // browser-safe alternative installed in node_modules. Nothing should
  // *actually* be external in the browser build (we want to bundle all deps) so
  // this is really just making sure we don't accidentally have any dependencies
  // on node built-ins in browser bundles.
  let dependencies = Object.keys(getAppDependencies(config));
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

const createEsbuildConfig = (ctx: Context): esbuild.BuildOptions => {
  return {
    entryPoints: {
      "css-bundle": cssBundleEntryModuleId,
    },
    outdir: ctx.config.assetsBuildDirectory,
    platform: "browser",
    format: "esm",
    external: getExternals(ctx.config),
    loader: loaders,
    bundle: true,
    logLevel: "silent",
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
      "process.env.REMIX_DEV_SERVER_WS_PORT": JSON.stringify(
        ctx.config.devServerPort
      ),
    },
    jsx: "automatic",
    jsxDev: ctx.options.mode !== "production",
    plugins: [
      cssBundleEntryModulePlugin(ctx),
      cssModulesPlugin(ctx, { outputCss: true }),
      vanillaExtractPlugin(ctx, { outputCss: true }),
      cssSideEffectImportsPlugin(ctx),
      cssFilePlugin(ctx),
      absoluteCssUrlsPlugin(),
      externalPlugin(/^https?:\/\//, { sideEffects: false }),
      mdxPlugin(ctx),
      // Skip compilation of common packages/scopes known not to include CSS imports
      emptyModulesPlugin(ctx, /^(@remix-run|react|react-dom)(\/.*)?$/, {
        includeNodeModules: true,
      }),
      emptyModulesPlugin(ctx, /\.server(\.[jt]sx?)?$/),
      externalPlugin(/^node:.*/, { sideEffects: false }),
    ],
    supported: {
      "import-meta": true,
    },
  };
};

export let create = async (ctx: Context) => {
  let compiler = await esbuild.context({
    ...createEsbuildConfig(ctx),
    write: false,
    metafile: true,
  });
  let compile = async () => {
    let { outputFiles, metafile } = await compiler.rebuild();
    writeMetafile(ctx, "metafile.css.json", metafile);
    let bundleOutputFile = outputFiles.find((outputFile) =>
      isBundle(ctx, outputFile, ".css")
    );
    return { bundleOutputFile, outputFiles };
  };
  return {
    compile,
    cancel: compiler.cancel,
    dispose: compiler.dispose,
  };
};
