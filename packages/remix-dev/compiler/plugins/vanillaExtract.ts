import { dirname, resolve } from "node:path";
import type { Compiler } from "@vanilla-extract/integration";
import { cssFileFilter, createCompiler } from "@vanilla-extract/integration";
import type { Plugin } from "esbuild";

import type { Options } from "../options";
import { loaders } from "../utils/loaders";
import { getPostcssProcessor } from "../utils/postcss";
import type { Context } from "../context";
import { getAppDependencies } from "../../dependencies";

const pluginName = "vanilla-extract-plugin";
const namespace = `${pluginName}-ns`;
const virtualCssFileFilter = /\.vanilla.css$/;

const staticAssetRegexp = new RegExp(
  `(${Object.keys(loaders)
    .filter((ext) => ext !== ".css" && loaders[ext] === "file")
    .join("|")})$`
);

let compiler: Compiler | undefined;
function getCompiler(root: string, mode: Options["mode"]) {
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

  return compiler;
}

export function vanillaExtractPlugin(
  { config, options }: Context,
  { outputCss }: { outputCss: boolean }
): Plugin {
  return {
    name: pluginName,
    async setup(build) {
      let appDependencies = getAppDependencies(config, true);
      if (!appDependencies["@vanilla-extract/css"]) {
        return;
      }

      let root = config.appDirectory;

      // Resolve virtual CSS files first to avoid resolving the same
      // file multiple times since this filter is more specific and
      // doesn't require a file system lookup.
      build.onResolve({ filter: virtualCssFileFilter }, (args) => {
        return {
          path: args.path,
          namespace,
        };
      });

      // Mark all .css.ts/js files as having side effects. This is to ensure
      // that all usages of `globalStyle` are included in the CSS bundle, even
      // if a .css.ts/js file has no exports or is otherwise tree-shaken.
      let preventInfiniteLoop = {};
      build.onResolve(
        { filter: /\.css(\.(j|t)sx?)?(\?.*)?$/, namespace: "file" },
        async (args) => {
          if (args.pluginData === preventInfiniteLoop) {
            return null;
          }

          let resolvedPath = (
            await build.resolve(args.path, {
              resolveDir: args.resolveDir,
              kind: args.kind,
              pluginData: preventInfiniteLoop,
            })
          ).path;

          if (!cssFileFilter.test(resolvedPath)) {
            return null;
          }

          return {
            path: resolvedPath,
            sideEffects: true,
          };
        }
      );

      build.onLoad(
        { filter: virtualCssFileFilter, namespace },
        async ({ path }) => {
          let [relativeFilePath] = path.split(".vanilla.css");
          let compiler = getCompiler(root, options.mode);
          let { css, filePath } = compiler.getCssForFile(relativeFilePath);
          let resolveDir = dirname(resolve(root, filePath));

          let postcssProcessor = await getPostcssProcessor({
            config,
            postcssContext: { vanillaExtract: true },
          });

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
        let compiler = getCompiler(root, options.mode);
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
