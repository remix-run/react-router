import { dirname, resolve } from "path";
import type { Compiler } from "@vanilla-extract/integration";
import { cssFileFilter, createCompiler } from "@vanilla-extract/integration";
import type { Plugin } from "esbuild";

import type { RemixConfig } from "../../config";
import type { CompileOptions } from "../options";
import { loaders } from "../loaders";
import { getPostcssProcessor } from "../utils/postcss";
import { vanillaExtractSideEffectsPlugin } from "./vanillaExtractSideEffectsPlugin";

const pluginName = "vanilla-extract-plugin-cached";
const namespace = `${pluginName}-ns`;
const virtualCssFileFilter = /\.vanilla.css$/;

const staticAssetRegexp = new RegExp(
  `(${Object.keys(loaders)
    .filter((ext) => ext !== ".css" && loaders[ext] === "file")
    .join("|")})$`
);

let compiler: Compiler;

export function vanillaExtractPluginCached({
  config,
  mode,
  outputCss,
}: {
  config: RemixConfig;
  mode: CompileOptions["mode"];
  outputCss: boolean;
}): Plugin {
  return {
    name: pluginName,
    async setup(build) {
      let root = config.appDirectory;

      compiler =
        compiler ||
        createCompiler({
          root,
          identifiers: mode === "production" ? "short" : "debug",
          vitePlugins: [
            {
              name: "remix-assets",
              enforce: "pre",
              async resolveId(source) {
                // Handle root-relative imports within Vanilla Extract files
                if (source.startsWith("~")) {
                  return await this.resolve(source.replace("~", ""));
                }
                // Handle static asset JS imports
                if (source.startsWith("/") && staticAssetRegexp.test(source)) {
                  return {
                    external: true,
                    id: "~" + source,
                  };
                }
              },
              transform(code) {
                // Translate Vite's fs import format for root-relative imports
                return code.replace(/\/@fs\/~\//g, "~/");
              },
            },
          ],
        });

      let postcssProcessor = await getPostcssProcessor({
        config,
        context: {
          vanillaExtract: true,
        },
      });

      // Resolve virtual CSS files first to avoid resolving the same
      // file multiple times since this filter is more specific and
      // doesn't require a file system lookup.
      build.onResolve({ filter: virtualCssFileFilter }, (args) => {
        return {
          path: args.path,
          namespace,
        };
      });

      vanillaExtractSideEffectsPlugin.setup(build);

      build.onLoad(
        { filter: virtualCssFileFilter, namespace },
        async ({ path }) => {
          let [relativeFilePath] = path.split(".vanilla.css");
          let { css, filePath } = compiler.getCssForFile(relativeFilePath);
          let resolveDir = dirname(resolve(root, filePath));

          if (postcssProcessor) {
            css = (
              await postcssProcessor.process(css, {
                from: path,
                to: path,
              })
            ).css;
          }

          return {
            contents: css,
            loader: "css",
            resolveDir,
          };
        }
      );

      build.onLoad({ filter: cssFileFilter }, async ({ path: filePath }) => {
        let { source, watchFiles } = await compiler.processVanillaFile(
          filePath,
          { outputCss }
        );

        return {
          contents: source,
          resolveDir: dirname(filePath),
          loader: "js",
          watchFiles: (Array.from(watchFiles) || []).map((watchFile) =>
            watchFile.startsWith("~")
              ? resolve(root, watchFile.replace("~", "."))
              : watchFile
          ),
        };
      });
    },
  };
}
