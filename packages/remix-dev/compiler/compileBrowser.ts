import * as path from "path";
import * as fse from "fs-extra";
import { builtinModules as nodeBuiltins } from "module";
import * as esbuild from "esbuild";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import postcss from "postcss";
import postcssDiscardDuplicates from "postcss-discard-duplicates";

import type { WriteChannel } from "../channel";
import type { RemixConfig } from "../config";
import type { AssetsManifest } from "./assets";
import { createAssetsManifest } from "./assets";
import { getAppDependencies } from "./dependencies";
import { loaders } from "./loaders";
import type { CompileOptions } from "./options";
import { browserRouteModulesPlugin } from "./plugins/browserRouteModulesPlugin";
import { cssFilePlugin } from "./plugins/cssFilePlugin";
import { deprecatedRemixPackagePlugin } from "./plugins/deprecatedRemixPackagePlugin";
import { emptyModulesPlugin } from "./plugins/emptyModulesPlugin";
import { mdxPlugin } from "./plugins/mdx";
import { urlImportsPlugin } from "./plugins/urlImportsPlugin";
import { cssModulesPlugin } from "./plugins/cssModulesPlugin";
import {
  cssBundleEntryModulePlugin,
  cssBundleEntryModuleId,
} from "./plugins/cssBundleEntryModulePlugin";
import { writeFileSafe } from "./utils/fs";
import invariant from "../invariant";

export type BrowserCompiler = {
  // produce ./public/build/
  compile: (manifestChannel: WriteChannel<AssetsManifest>) => Promise<void>;
  dispose: () => void;
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

const writeAssetsManifest = async (
  config: RemixConfig,
  assetsManifest: AssetsManifest
) => {
  let filename = `manifest-${assetsManifest.version.toUpperCase()}.js`;

  assetsManifest.url = config.publicPath + filename;

  await writeFileSafe(
    path.join(config.assetsBuildDirectory, filename),
    `window.__remixManifest=${JSON.stringify(assetsManifest)};`
  );
};

const createEsbuildConfig = (
  build: "app" | "css",
  config: RemixConfig,
  options: CompileOptions
): esbuild.BuildOptions | esbuild.BuildIncremental => {
  let isCssBuild = build === "css";
  let entryPoints: esbuild.BuildOptions["entryPoints"];

  if (isCssBuild) {
    entryPoints = {
      "css-bundle": cssBundleEntryModuleId,
    };
  } else {
    entryPoints = {
      "entry.client": path.resolve(config.appDirectory, config.entryClientFile),
    };

    for (let id of Object.keys(config.routes)) {
      // All route entry points are virtual modules that will be loaded by the
      // browserEntryPointsPlugin. This allows us to tree-shake server-only code
      // that we don't want to run in the browser (i.e. action & loader).
      entryPoints[id] = config.routes[id].file + "?browser";
    }
  }

  let plugins: esbuild.Plugin[] = [
    deprecatedRemixPackagePlugin(options.onWarning),
    ...(config.future.unstable_cssModules
      ? [
          ...(isCssBuild ? [cssBundleEntryModulePlugin(config)] : []),
          cssModulesPlugin({
            mode: options.mode,
            rootDirectory: config.rootDirectory,
            outputCss: isCssBuild,
          }),
        ]
      : []),
    cssFilePlugin({
      mode: options.mode,
      rootDirectory: config.rootDirectory,
    }),
    urlImportsPlugin(),
    mdxPlugin(config),
    browserRouteModulesPlugin(config, /\?browser$/),
    emptyModulesPlugin(config, /\.server(\.[jt]sx?)?$/),
    NodeModulesPolyfillPlugin(),
  ];

  return {
    entryPoints,
    outdir: config.assetsBuildDirectory,
    platform: "browser",
    format: "esm",
    external: getExternals(config),
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
  };
};

export const createBrowserCompiler = (
  remixConfig: RemixConfig,
  options: CompileOptions
): BrowserCompiler => {
  let appCompiler: esbuild.BuildIncremental;
  let cssCompiler: esbuild.BuildIncremental;

  let compile = async (manifestChannel: WriteChannel<AssetsManifest>) => {
    let appBuildTask = async () => {
      appCompiler = await (!appCompiler
        ? esbuild.build({
            ...createEsbuildConfig("app", remixConfig, options),
            metafile: true,
            incremental: true,
          })
        : appCompiler.rebuild());

      invariant(
        appCompiler.metafile,
        "Expected app compiler metafile to be defined. This is likely a bug in Remix. Please open an issue at https://github.com/remix-run/remix/issues/new"
      );
    };

    let cssBuildTask = async () => {
      if (!remixConfig.future.unstable_cssModules) {
        return;
      }

      // The types aren't great when combining write: false and incremental: true
      //  so we need to assert that it's an incremental build
      cssCompiler = (await (!cssCompiler
        ? esbuild.build({
            ...createEsbuildConfig("css", remixConfig, options),
            metafile: true,
            incremental: true,
            write: false,
          })
        : cssCompiler.rebuild())) as esbuild.BuildIncremental;

      invariant(
        cssCompiler.metafile,
        "Expected CSS compiler metafile to be defined. This is likely a bug in Remix. Please open an issue at https://github.com/remix-run/remix/issues/new"
      );

      let outputFiles = cssCompiler.outputFiles || [];

      let isCssBundleFile = (
        outputFile: esbuild.OutputFile,
        extension: ".css" | ".css.map"
      ): boolean => {
        return (
          path.dirname(outputFile.path) === remixConfig.assetsBuildDirectory &&
          path.basename(outputFile.path).startsWith("css-bundle") &&
          outputFile.path.endsWith(extension)
        );
      };

      let cssBundleFile = outputFiles.find((outputFile) =>
        isCssBundleFile(outputFile, ".css")
      );

      if (!cssBundleFile) {
        return;
      }

      let cssBundlePath = cssBundleFile.path;

      // Get esbuild's existing CSS source map so we can pass it to PostCSS
      let cssBundleSourceMap = outputFiles.find((outputFile) =>
        isCssBundleFile(outputFile, ".css.map")
      )?.text;

      let { css, map } = await postcss([
        // We need to discard duplicate rules since "composes"
        // in CSS Modules can result in duplicate styles
        postcssDiscardDuplicates(),
      ]).process(cssBundleFile.text, {
        from: cssBundlePath,
        to: cssBundlePath,
        map: {
          prev: cssBundleSourceMap,
          inline: false,
          annotation: false,
          sourcesContent: true,
        },
      });

      await fse.ensureDir(path.dirname(cssBundlePath));

      await Promise.all([
        fse.writeFile(cssBundlePath, css),
        options.mode !== "production" && map
          ? fse.writeFile(`${cssBundlePath}.map`, map.toString()) // Write our updated source map rather than esbuild's
          : null,
      ]);

      // Return the CSS bundle path so we can use it to generate the manifest
      return cssBundlePath;
    };

    let [cssBundlePath] = await Promise.all([cssBuildTask(), appBuildTask()]);

    let manifest = await createAssetsManifest({
      config: remixConfig,
      metafile: appCompiler.metafile!,
      cssBundlePath,
    });
    manifestChannel.write(manifest);
    await writeAssetsManifest(remixConfig, manifest);
  };

  return {
    compile,
    dispose: () => {
      appCompiler?.rebuild.dispose();
      cssCompiler?.rebuild.dispose();
    },
  };
};
