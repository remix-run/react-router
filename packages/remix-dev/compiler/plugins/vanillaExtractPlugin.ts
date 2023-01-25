import { dirname, join, extname } from "path";
import type { IdentifierOption } from "@vanilla-extract/integration";
import {
  cssFileFilter,
  virtualCssFileFilter,
  processVanillaFile,
  getSourceFromVirtualCssFile,
  transform,
} from "@vanilla-extract/integration";
import * as fse from "fs-extra";
import * as esbuild from "esbuild";

import type { RemixConfig } from "../../config";
import type { CompileOptions } from "../options";
import { loaders } from "../loaders";
import { getPostcssProcessor } from "../utils/postcss";

const pluginName = "vanilla-extract-plugin";
const namespace = `${pluginName}-ns`;

export function vanillaExtractPlugin({
  config,
  mode,
  outputCss,
}: {
  config: RemixConfig;
  mode: CompileOptions["mode"];
  outputCss: boolean;
}): esbuild.Plugin {
  return {
    name: pluginName,
    async setup(build) {
      let postcssProcessor = await getPostcssProcessor({
        config,
        context: {
          vanillaExtract: true,
        },
      });
      let { rootDirectory } = config;

      build.onResolve({ filter: virtualCssFileFilter }, (args) => {
        return {
          path: args.path,
          namespace,
        };
      });

      build.onLoad(
        { filter: virtualCssFileFilter, namespace },
        async ({ path }) => {
          let { source, fileName } = await getSourceFromVirtualCssFile(path);
          let resolveDir = dirname(join(rootDirectory, fileName));

          if (postcssProcessor) {
            source = (
              await postcssProcessor.process(source, {
                from: path,
                to: path,
              })
            ).css;
          }

          return {
            contents: source,
            loader: "css",
            resolveDir,
          };
        }
      );

      build.onLoad({ filter: cssFileFilter }, async ({ path: filePath }) => {
        let identOption: IdentifierOption =
          mode === "production" ? "short" : "debug";

        let { outputFiles } = await esbuild.build({
          entryPoints: [filePath],
          outdir: config.assetsBuildDirectory,
          assetNames: build.initialOptions.assetNames,
          bundle: true,
          external: ["@vanilla-extract"],
          platform: "node",
          write: false,
          plugins: [
            vanillaExtractTransformPlugin({ rootDirectory, identOption }),
          ],
          loader: loaders,
          absWorkingDir: rootDirectory,
          publicPath: config.publicPath,
        });

        let source = outputFiles.find((file) =>
          file.path.endsWith(".js")
        )?.text;

        if (!source) {
          return null;
        }

        let [contents] = await Promise.all([
          processVanillaFile({
            source,
            filePath,
            outputCss,
            identOption,
          }),
          outputCss && writeAssets(outputFiles),
        ]);

        return {
          contents,
          resolveDir: dirname(filePath),
          loader: "js",
        };
      });
    },
  };
}

async function writeAssets(
  outputFiles: Array<esbuild.OutputFile>
): Promise<void> {
  await Promise.all(
    outputFiles
      .filter((file) => !file.path.endsWith(".js"))
      .map(async (file) => {
        await fse.ensureDir(dirname(file.path));
        await fse.writeFile(file.path, file.contents);
      })
  );
}

const loaderForExtension: Record<string, esbuild.Loader> = {
  ".js": "js",
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
};

/**
 * This plugin is used within the child compilation. It applies the Vanilla
 * Extract file transform to all .css.ts/js files. This is used to add "file
 * scope" annotations, which is done via function calls at the beginning and end
 * of each file so that we can tell which CSS file the styles belong to when
 * evaluating the JS. It's also done to automatically apply debug IDs.
 */
function vanillaExtractTransformPlugin({
  rootDirectory,
  identOption,
}: {
  identOption: IdentifierOption;
  rootDirectory: string;
}): esbuild.Plugin {
  return {
    name: "vanilla-extract-transform-plugin",
    setup(build) {
      build.onLoad({ filter: cssFileFilter }, async ({ path }) => {
        let source = await fse.readFile(path, "utf-8");

        let contents = await transform({
          source,
          filePath: path,
          rootPath: rootDirectory,
          packageName: "remix-app", // This option is designed to support scoping hashes for libraries, we can hard code an arbitrary value for simplicity
          identOption,
        });

        return {
          contents,
          loader: loaderForExtension[extname(path)],
          resolveDir: dirname(path),
        };
      });
    },
  };
}
