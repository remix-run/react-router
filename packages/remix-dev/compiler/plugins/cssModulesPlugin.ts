import path from "path";
import type { Plugin, PluginBuild } from "esbuild";
import fse from "fs-extra";
import postcss from "postcss";
import postcssModules from "postcss-modules";

import type { CompileOptions } from "../options";

const pluginName = "css-modules-plugin";
const namespace = `${pluginName}-ns`;
const cssModulesFilter = /\.module\.css$/;
const compiledCssQuery = "?css-modules-plugin-compiled-css";
const compiledCssFilter = /\?css-modules-plugin-compiled-css$/;

interface PluginData {
  resolveDir: string;
  compiledCss: string;
}

export const cssModulesPlugin = (options: {
  mode: CompileOptions["mode"];
  rootDirectory: string;
  outputCss: boolean;
}): Plugin => {
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

        let fileContents = await fse.readFile(absolutePath, "utf8");
        let exports: Record<string, string> = {};

        let { css: compiledCss } = await postcss([
          postcssModules({
            generateScopedName:
              options.mode === "production"
                ? "[hash:base64:5]"
                : "[name]__[local]__[hash:base64:5]",
            getJSON: function (_, json) {
              exports = json;
            },
            async resolve(id, importer) {
              return (
                await build.resolve(id, {
                  resolveDir: path.dirname(importer),
                  kind: "require-resolve",
                })
              ).path;
            },
          }),
        ]).process(fileContents, {
          from: absolutePath,
          to: absolutePath,
        });

        // Each .module.css file ultimately resolves as a JS file that imports
        // a virtual CSS file containing the compiled CSS, and exports the
        // object that maps local names to generated class names. The compiled
        // CSS file contents are passed to the virtual CSS file via pluginData.
        let contents = [
          options.outputCss
            ? `import "./${path.basename(absolutePath)}${compiledCssQuery}";`
            : null,
          `export default ${JSON.stringify(exports)};`,
        ]
          .filter(Boolean)
          .join("\n");

        let pluginData: PluginData = {
          resolveDir,
          compiledCss,
        };

        return {
          contents,
          loader: "js" as const,
          pluginData,
        };
      });

      build.onResolve({ filter: compiledCssFilter }, async (args) => {
        let pluginData: PluginData = args.pluginData;
        let absolutePath = path.resolve(args.resolveDir, args.path);

        return {
          namespace,
          path: path.relative(options.rootDirectory, absolutePath),
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
