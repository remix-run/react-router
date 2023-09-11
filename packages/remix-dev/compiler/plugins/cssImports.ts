import * as path from "node:path";
import fse from "fs-extra";
import esbuild from "esbuild";

import invariant from "../../invariant";
import type { Context } from "../context";
import {
  getPostcssProcessor,
  populateDependenciesFromMessages,
} from "../utils/postcss";
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

      build.onLoad({ filter: /\.css$/ }, async (args) => {
        let cacheKey = `css-file:${args.path}`;
        let {
          cacheValue: {
            contents,
            watchFiles,
            warnings,
            outputFilesWithoutEntry,
          },
        } = await ctx.fileWatchCache.getOrSet(cacheKey, async () => {
          let fileDependencies = new Set([args.path]);
          let globDependencies = new Set<string>();

          // eslint-disable-next-line prefer-let/prefer-let -- Avoid needing to repeatedly check for null since const can't be reassigned
          const postcssProcessor = await getPostcssProcessor(ctx);

          let { metafile, outputFiles, warnings, errors } = await esbuild.build(
            {
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
                            async (args) => {
                              let contents = await fse.readFile(
                                args.path,
                                "utf-8"
                              );

                              let { css, messages } =
                                await postcssProcessor.process(contents, {
                                  from: args.path,
                                  to: args.path,
                                  map: ctx.options.sourcemap,
                                });

                              populateDependenciesFromMessages({
                                messages,
                                fileDependencies,
                                globDependencies,
                              });

                              return {
                                contents: css,
                                loader: "css",
                              };
                            }
                          );
                        },
                      } satisfies esbuild.Plugin,
                    ]
                  : []),
              ],
            }
          );

          if (errors && errors.length) {
            throw { errors };
          }

          invariant(metafile, "metafile is missing");
          let { outputs } = metafile;
          let entry = Object.keys(outputs).find(
            (out) => outputs[out].entryPoint
          );
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

          // add all css assets to dependencies
          for (let { inputs } of Object.values(outputs)) {
            for (let input of Object.keys(inputs)) {
              let resolvedInput = path.resolve(input);
              fileDependencies.add(resolvedInput);
            }
          }

          return {
            cacheValue: {
              contents: entryFile.contents,
              // add all dependencies to watchFiles
              watchFiles: Array.from(fileDependencies),
              warnings,
              outputFilesWithoutEntry,
            },
            fileDependencies,
            globDependencies,
          };
        });

        // write all assets
        await Promise.all(
          outputFilesWithoutEntry.map(({ path: filepath, contents }) =>
            fse.outputFile(filepath, contents)
          )
        );

        return {
          contents,
          loader: "file",
          watchFiles,
          warnings,
        };
      });
    },
  };
}
