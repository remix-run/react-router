import * as path from "path";
import * as fse from "fs-extra";
import { builtinModules as nodeBuiltins } from "module";
import * as esbuild from "esbuild";
import { polyfillNode as NodeModulesPolyfillPlugin } from "esbuild-plugin-polyfill-node";
import postcss from "postcss";
import postcssDiscardDuplicates from "postcss-discard-duplicates";

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
} from "./plugins/cssBundleEntry";
import type { WriteChannel } from "../../channel";
import type { Context } from "../context";

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
  let plugins: esbuild.Plugin[] = [
    cssBundleEntryModulePlugin(ctx),
    cssModulesPlugin(ctx, { outputCss: true }),
    vanillaExtractPlugin(ctx, { outputCss: true }),
    cssSideEffectImportsPlugin(ctx),
    cssFilePlugin(ctx),
    absoluteCssUrlsPlugin(),
    externalPlugin(/^https?:\/\//, { sideEffects: false }),
    mdxPlugin(ctx),
    emptyModulesPlugin(ctx, /\.server(\.[jt]sx?)?$/),
    NodeModulesPolyfillPlugin(),
    externalPlugin(/^node:.*/, { sideEffects: false }),
  ];

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
    plugins,
    supported: {
      "import-meta": true,
    },
  };
};

export let create = async (
  ctx: Context,
  channels: { cssBundleHref: WriteChannel<string | undefined> }
) => {
  let compiler = await esbuild.context({
    ...createEsbuildConfig(ctx),
    metafile: true,
    write: false,
  });
  let compile = async () => {
    try {
      let { outputFiles } = await compiler.rebuild();

      let isCssBundleFile = (
        outputFile: esbuild.OutputFile,
        extension: ".css" | ".css.map"
      ): boolean => {
        return (
          path.dirname(outputFile.path) === ctx.config.assetsBuildDirectory &&
          path.basename(outputFile.path).startsWith("css-bundle") &&
          outputFile.path.endsWith(extension)
        );
      };

      let cssBundleFile = outputFiles.find((outputFile) =>
        isCssBundleFile(outputFile, ".css")
      );

      if (!cssBundleFile) {
        channels.cssBundleHref.write(undefined);
        return;
      }

      let cssBundlePath = cssBundleFile.path;

      let cssBundleHref =
        ctx.config.publicPath +
        path.relative(
          ctx.config.assetsBuildDirectory,
          path.resolve(cssBundlePath)
        );

      channels.cssBundleHref.write(cssBundleHref);

      let { css, map } = await postcss([
        // We need to discard duplicate rules since "composes"
        // in CSS Modules can result in duplicate styles
        postcssDiscardDuplicates(),
      ]).process(cssBundleFile.text, {
        from: cssBundlePath,
        to: cssBundlePath,
        map: ctx.options.sourcemap && {
          prev: outputFiles.find((outputFile) =>
            isCssBundleFile(outputFile, ".css.map")
          )?.text,
          inline: false,
          annotation: false,
          sourcesContent: true,
        },
      });

      await fse.ensureDir(path.dirname(cssBundlePath));

      await Promise.all([
        fse.writeFile(cssBundlePath, css),
        ctx.options.mode !== "production" && map
          ? fse.writeFile(`${cssBundlePath}.map`, map.toString()) // Write our updated source map rather than esbuild's
          : null,
        ...outputFiles
          .filter((outputFile) => !/\.(css|js|map)$/.test(outputFile.path))
          .map(async (asset) => {
            await fse.ensureDir(path.dirname(asset.path));
            await fse.writeFile(asset.path, asset.contents);
          }),
      ]);

      return cssBundleHref;
    } catch (error) {
      channels.cssBundleHref.write(undefined);
      throw error;
    }
  };
  return {
    compile,
    dispose: compiler.dispose,
  };
};
