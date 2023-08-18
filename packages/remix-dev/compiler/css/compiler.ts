import { builtinModules as nodeBuiltins } from "node:module";
import * as esbuild from "esbuild";

import type { RemixConfig } from "../../config";
import { getAppDependencies } from "../../dependencies";
import { loaders } from "../utils/loaders";
import { cssTarget } from "../utils/cssTarget";
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
import { groupCssBundleFiles } from "./bundle";
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

const createCompilerEsbuildConfig = (ctx: Context): esbuild.BuildOptions => {
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
    // Minification is handled via a separate esbuild pass. This is because CSS
    // minification takes into account the "target" option (e.g. the CSS
    // properties top/bottom/left/right when used as a set will be minified to
    // shorthand of "inset" if supported by the target browsers), but this
    // option affects all code in the build, not just CSS. If we set the target
    // too low, we get build errors when esbuild detects JS features that can't
    // be transpiled for the specified target. By separating the minification of
    // CSS files from the compilation of the entire module graph, we're better
    // able to target the Remix browser support baseline, i.e. anything that
    // supports ES module scripts: https://caniuse.com/es6-module
    minify: false,
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    publicPath: ctx.config.publicPath,
    define: {
      "process.env.NODE_ENV": JSON.stringify(ctx.options.mode),
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

const createCssProcessorEsbuildConfig = ({
  ctx,
  cssContents,
  sourceMapContents,
}: {
  ctx: Context;
  cssContents: string;
  sourceMapContents: string | null;
}): esbuild.BuildOptions => {
  let sourceMapString = sourceMapContents
    ? `/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
        sourceMapContents
      ).toString("base64")} */`
    : null;

  let cssProcessorEntryId = ":contents"; // Could be anything, but this makes the output CSS comment look nicer - /* css-bundle::contents */
  let cssProcessorEntryFilter = new RegExp(`^${cssProcessorEntryId}$`);

  return {
    entryPoints: { "css-bundle": cssProcessorEntryId }, // This ensures the generated file name starts with "css-bundle"
    outdir: ctx.config.assetsBuildDirectory,
    bundle: true,
    // We only want to process the CSS bundle contents so anything else is external
    external: ["*"],
    logLevel: "silent",
    sourcemap: ctx.options.sourcemap,
    // As pointed out by https://github.com/evanw/esbuild/issues/2440, when tsconfig is set to
    // `undefined`, esbuild will keep looking for a tsconfig.json recursively up. This unwanted
    // behavior can only be avoided by creating an empty tsconfig file in the root directory.
    tsconfig: ctx.config.tsconfigPath,
    minify: ctx.options.mode === "production",
    target: cssTarget,
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "_shared/[name]-[hash]",
    assetNames: "_assets/[name]-[hash]",
    publicPath: ctx.config.publicPath,
    plugins: [
      {
        name: "css-processor-input",
        setup(build) {
          build.onResolve({ filter: cssProcessorEntryFilter }, ({ path }) => {
            return {
              path,
              namespace: "css-bundle",
            };
          });

          build.onLoad({ filter: cssProcessorEntryFilter }, async () => {
            return {
              loader: "css",
              contents: [cssContents, sourceMapString]
                .filter(Boolean)
                .join("\n"),
            };
          });
        },
      },
    ],
  };
};

export let create = async (ctx: Context) => {
  let compiler = await esbuild.context({
    ...createCompilerEsbuildConfig(ctx),
    write: false,
    metafile: true,
  });

  let compile = async () => {
    let rawResult = await compiler.rebuild();
    writeMetafile(ctx, "metafile.css.json", rawResult.metafile);

    let rawFiles = groupCssBundleFiles(ctx, rawResult.outputFiles);

    // We hand the result to a 2nd esbuild pass to optionally handle CSS
    // minification with its own "target" separate from the JS build. This
    // happens in dev mode to keep dev and production builds as close as
    // possible even though it's not strictly required.
    let processedResult = rawFiles.css?.text
      ? await esbuild.build({
          ...createCssProcessorEsbuildConfig({
            ctx,
            cssContents: rawFiles.css.text,
            sourceMapContents: rawFiles.sourceMap?.text ?? null,
          }),
          write: false,
          metafile: false,
        })
      : null;

    let processedFiles = processedResult?.outputFiles ?? [];

    return {
      bundleOutputFile: groupCssBundleFiles(ctx, processedFiles).css,
      outputFiles: [...processedFiles, ...rawFiles.assets],
    };
  };
  return {
    compile,
    cancel: compiler.cancel,
    dispose: compiler.dispose,
  };
};
