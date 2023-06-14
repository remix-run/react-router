import * as path from "path";
import * as fse from "fs-extra";
import esbuild from "esbuild";

import invariant from "../../invariant";
import type { Context } from "../context";
import { getCachedPostcssProcessor } from "../utils/postcss";
import { absoluteCssUrlsPlugin } from "./absoluteCssUrlsPlugin";

const isExtendedLengthPath = /^\\\\\?\\/;

function normalizePathSlashes(p: string) {
  return isExtendedLengthPath.test(p) ? p : p.replace(/\\/g, "/");
}

/**
 * This plugin loads css files with the "css" loader (bundles and moves assets to assets directory)
 * and exports the url of the css file as its default export.
 */
export function cssFilePlugin(ctx: Context): esbuild.Plugin {
  return {
    name: "css-file",

    async setup(build) {
      let {
        absWorkingDir,
        assetNames,
        chunkNames,
        conditions,
        define,
        external,
        sourceRoot,
        treeShaking,
        tsconfig,
        format,
        loader,
        mainFields,
        nodePaths,
        platform,
        publicPath,
        target,
      } = build.initialOptions;

      // eslint-disable-next-line prefer-let/prefer-let -- Avoid needing to repeatedly check for null since const can't be reassigned
      const postcssProcessor = await getCachedPostcssProcessor(ctx);

      build.onLoad({ filter: /\.css$/ }, async (args) => {
        let { metafile, outputFiles, warnings, errors } = await esbuild.build({
          absWorkingDir,
          assetNames,
          chunkNames,
          conditions,
          define,
          external,
          format,
          mainFields,
          nodePaths,
          platform,
          publicPath,
          sourceRoot,
          target,
          treeShaking,
          tsconfig,
          minify: ctx.options.mode === "production",
          bundle: true,
          minifySyntax: true,
          metafile: true,
          write: false,
          sourcemap: Boolean(ctx.options.sourcemap && postcssProcessor), // We only need source maps if we're processing the CSS with PostCSS
          splitting: false,
          outdir: ctx.config.assetsBuildDirectory,
          entryNames: assetNames,
          entryPoints: [args.path],
          loader: {
            ...loader,
            ".css": "css",
          },
          plugins: [
            absoluteCssUrlsPlugin(),
            ...(postcssProcessor
              ? [
                  {
                    name: "postcss-plugin",
                    async setup(build) {
                      build.onLoad(
                        { filter: /\.css$/, namespace: "file" },
                        async (args) => ({
                          contents: await postcssProcessor({ path: args.path }),
                          loader: "css",
                        })
                      );
                    },
                  } satisfies esbuild.Plugin,
                ]
              : []),
          ],
        });

        if (errors && errors.length) {
          return { errors };
        }

        invariant(metafile, "metafile is missing");
        let { outputs } = metafile;
        let entry = Object.keys(outputs).find((out) => outputs[out].entryPoint);
        invariant(entry, "entry point not found");

        let normalizedEntry = path.resolve(
          ctx.config.rootDirectory,
          normalizePathSlashes(entry)
        );
        let entryFile = outputFiles.find((file) => {
          return (
            path.resolve(
              ctx.config.rootDirectory,
              normalizePathSlashes(file.path)
            ) === normalizedEntry
          );
        });

        invariant(entryFile, "entry file not found");

        let outputFilesWithoutEntry = outputFiles.filter(
          (file) => file !== entryFile
        );

        // write all assets
        await Promise.all(
          outputFilesWithoutEntry.map(({ path: filepath, contents }) =>
            fse.outputFile(filepath, contents)
          )
        );

        return {
          contents: entryFile.contents,
          loader: "file",
          // add all css assets to watchFiles
          watchFiles: Object.values(outputs).reduce<string[]>(
            (arr, { inputs }) => {
              let resolvedInputs = Object.keys(inputs).map((input) => {
                return path.resolve(input);
              });
              arr.push(...resolvedInputs);
              return arr;
            },
            []
          ),
          warnings,
        };
      });
    },
  };
}
