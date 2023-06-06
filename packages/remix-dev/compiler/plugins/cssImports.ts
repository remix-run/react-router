import * as path from "path";
import * as fse from "fs-extra";
import esbuild from "esbuild";
import type { Processor } from "postcss";

import invariant from "../../invariant";
import type { Context } from "../context";
import { getPostcssProcessor } from "../utils/postcss";
import { absoluteCssUrlsPlugin } from "./absoluteCssUrlsPlugin";

const isExtendedLengthPath = /^\\\\\?\\/;

function normalizePathSlashes(p: string) {
  return isExtendedLengthPath.test(p) ? p : p.replace(/\\/g, "/");
}

/**
 * This plugin loads css files with the "css" loader (bundles and moves assets to assets directory)
 * and exports the url of the css file as its default export.
 */
export function cssFilePlugin({
  config,
  options,
  fileWatchCache,
}: Context): esbuild.Plugin {
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

      let postcssProcessor = await getPostcssProcessor({ config });

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
          minify: options.mode === "production",
          bundle: true,
          minifySyntax: true,
          metafile: true,
          write: false,
          sourcemap: Boolean(options.sourcemap && postcssProcessor), // We only need source maps if we're processing the CSS with PostCSS
          splitting: false,
          outdir: config.assetsBuildDirectory,
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
                  postcssPlugin({
                    fileWatchCache,
                    postcssProcessor,
                    options,
                  }),
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
          config.rootDirectory,
          normalizePathSlashes(entry)
        );
        let entryFile = outputFiles.find((file) => {
          return (
            path.resolve(
              config.rootDirectory,
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

function postcssPlugin({
  fileWatchCache,
  postcssProcessor,
  options,
}: {
  fileWatchCache: Context["fileWatchCache"];
  postcssProcessor: Processor;
  options: Context["options"];
}): esbuild.Plugin {
  return {
    name: "postcss-plugin",
    async setup(build) {
      build.onLoad({ filter: /\.css$/, namespace: "file" }, async (args) => {
        let cacheKey = `postcss-plugin?sourcemap=${options.sourcemap}&path=${args.path}`;

        let { cacheValue } = await fileWatchCache.getOrSet(
          cacheKey,
          async () => {
            let contents = await fse.readFile(args.path, "utf-8");

            let { css, messages } = await postcssProcessor.process(contents, {
              from: args.path,
              to: args.path,
              map: options.sourcemap,
            });

            let fileDependencies = new Set<string>();
            let globDependencies = new Set<string>();

            // Ensure the CSS file being passed to PostCSS is tracked as a
            // dependency of this cache key since a change to this file should
            // invalidate the cache, not just its sub-dependencies.
            fileDependencies.add(args.path);

            // PostCSS plugin result objects can contain arbitrary messages returned
            // from plugins. Here we look for messages that indicate a dependency
            // on another file or glob. Here we target the generic dependency messages
            // returned from 'postcss-import' and 'tailwindcss' plugins, but we may
            // need to add more in the future depending on what other plugins do.
            // More info:
            // - https://postcss.org/api/#result
            // - https://postcss.org/api/#message
            for (let message of messages) {
              if (
                message.type === "dependency" &&
                typeof message.file === "string"
              ) {
                fileDependencies.add(message.file);
                continue;
              }

              if (
                message.type === "dir-dependency" &&
                typeof message.dir === "string" &&
                typeof message.glob === "string"
              ) {
                globDependencies.add(path.join(message.dir, message.glob));
                continue;
              }
            }

            return {
              cacheValue: css,
              fileDependencies,
              globDependencies,
            };
          }
        );

        return {
          contents: cacheValue,
          loader: "css",
        };
      });
    },
  };
}
