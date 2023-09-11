import path from "node:path";
import type { Plugin, PluginBuild } from "esbuild";
import fse from "fs-extra";
import postcss from "postcss";
import postcssModules from "postcss-modules";

import {
  loadPostcssPlugins,
  populateDependenciesFromMessages,
} from "../utils/postcss";
import type { Context } from "../context";

const pluginName = "css-modules-plugin";
const namespace = `${pluginName}-ns`;
const cssModulesFilter = /\.module\.css$/;
const compiledCssQuery = "?css-modules-plugin-compiled-css";
const compiledCssFilter = /\?css-modules-plugin-compiled-css$/;

interface PluginData {
  resolveDir: string;
  compiledCss: string;
}

export const cssModulesPlugin = (
  { config, options, fileWatchCache }: Context,
  { outputCss }: { outputCss: boolean }
): Plugin => {
  return {
    name: pluginName,
    setup: async (build: PluginBuild) => {
      build.onResolve(
        { filter: cssModulesFilter, namespace: "file" },
        async (args) => {
          let resolvedPath = (
            await build.resolve(args.path, {
              resolveDir: args.resolveDir,
              kind: args.kind,
            })
          ).path;

          return {
            path: resolvedPath,
          };
        }
      );

      build.onLoad({ filter: cssModulesFilter }, async (args) => {
        let { path: absolutePath } = args;
        let resolveDir = path.dirname(absolutePath);

        let cacheKey = `css-module:${absolutePath}?mode=${options.mode}`;
        let { cacheValue } = await fileWatchCache.getOrSet(
          cacheKey,
          async () => {
            let fileContents = await fse.readFile(absolutePath, "utf8");
            let exports: Record<string, string> = {};

            let fileDependencies = new Set<string>([absolutePath]);
            let globDependencies = new Set<string>();

            let postcssPlugins = await loadPostcssPlugins({ config });

            let { css: compiledCss, messages } = await postcss([
              ...postcssPlugins,
              postcssModules({
                generateScopedName:
                  options.mode === "production"
                    ? "[hash:base64:5]"
                    : "[name]__[local]__[hash:base64:5]",
                getJSON: function (_, json) {
                  exports = json;
                },
                async resolve(id, importer) {
                  let resolvedPath = (
                    await build.resolve(id, {
                      resolveDir: path.dirname(importer),
                      kind: "require-resolve",
                    })
                  ).path;

                  // Since postcss-modules doesn't add `dependency` messages the
                  // way other plugins do, we mark any files that are passed to
                  // the `resolve` callback as dependencies of this CSS Module
                  fileDependencies.add(resolvedPath);

                  return resolvedPath;
                },
              }),
            ]).process(fileContents, {
              from: absolutePath,
              to: absolutePath,
            });

            // Since we're also running with arbitrary user-defined PostCSS
            // plugins, we need to manage dependencies declared by other plugins
            populateDependenciesFromMessages({
              messages,
              fileDependencies,
              globDependencies,
            });

            let compiledJsWithoutCssImport = `export default ${JSON.stringify(
              exports
            )};`;

            // Each .module.css file ultimately resolves as a JS file that imports
            // a virtual CSS file containing the compiled CSS, and exports the
            // object that maps local names to generated class names. The compiled
            // CSS file contents are passed to the virtual CSS file via pluginData.
            let compiledJsWithCssImport = [
              `import "./${path.basename(absolutePath)}${compiledCssQuery}";`,
              compiledJsWithoutCssImport,
            ].join("\n");

            return {
              cacheValue: {
                // We need to cache both variants of the compiled JS since the
                // cache is shared between different builds. This allows each
                // build to ask for the JS variant it needs without needing to
                // generate its own custom JS on every build.
                compiledJsWithCssImport,
                compiledJsWithoutCssImport,
                compiledCss,
              },
              fileDependencies,
            };
          }
        );

        let {
          compiledJsWithCssImport,
          compiledJsWithoutCssImport,
          compiledCss,
        } = cacheValue;

        let pluginData: PluginData = {
          resolveDir,
          compiledCss,
        };

        return {
          contents: outputCss
            ? compiledJsWithCssImport
            : compiledJsWithoutCssImport,
          loader: "js" as const,
          pluginData,
        };
      });

      build.onResolve({ filter: compiledCssFilter }, async (args) => {
        let pluginData: PluginData = args.pluginData;
        let absolutePath = path.resolve(args.resolveDir, args.path);

        return {
          namespace,
          path: path.relative(config.rootDirectory, absolutePath),
          pluginData,
        };
      });

      build.onLoad({ filter: compiledCssFilter, namespace }, async (args) => {
        let pluginData: PluginData = args.pluginData;
        let { resolveDir, compiledCss } = pluginData;

        return {
          resolveDir,
          contents: compiledCss,
          loader: "css" as const,
        };
      });
    },
  };
};
