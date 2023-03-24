import * as path from "path";
import * as fse from "fs-extra";
import esbuild from "esbuild";
import type { Processor } from "postcss";

import invariant from "../../invariant";
import type { RemixConfig } from "../../config";
import type { CompileOptions } from "../options";
import { getPostcssProcessor } from "../utils/postcss";

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
}: {
  config: RemixConfig;
  options: CompileOptions;
}): esbuild.Plugin {
  return {
    name: "css-file",

    async setup(build) {
      let buildOps = build.initialOptions;

      let postcssProcessor = await getPostcssProcessor({ config });

      build.onLoad({ filter: /\.css$/ }, async (args) => {
        let { metafile, outputFiles, warnings, errors } = await esbuild.build({
          ...buildOps,
          minify: options.mode === "production",
          minifySyntax: true,
          metafile: true,
          write: false,
          sourcemap: Boolean(options.sourcemap && postcssProcessor), // We only need source maps if we're processing the CSS with PostCSS
          incremental: false,
          splitting: false,
          stdin: undefined,
          outfile: undefined,
          outdir: config.assetsBuildDirectory,
          entryNames: buildOps.assetNames,
          entryPoints: [args.path],
          loader: {
            ...buildOps.loader,
            ".css": "css",
          },
          // this plugin treats absolute paths in 'url()' css rules as external to prevent breaking changes
          plugins: [
            {
              name: "resolve-absolute",
              async setup(build) {
                build.onResolve({ filter: /.*/ }, async (args) => {
                  let { kind, path: resolvePath } = args;
                  if (kind === "url-token" && path.isAbsolute(resolvePath)) {
                    return {
                      path: resolvePath,
                      external: true,
                    };
                  }
                });
              },
            },
            ...(postcssProcessor
              ? [postcssPlugin({ postcssProcessor, options })]
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
  postcssProcessor,
  options,
}: {
  postcssProcessor: Processor;
  options: CompileOptions;
}): esbuild.Plugin {
  return {
    name: "postcss-plugin",
    async setup(build) {
      build.onLoad({ filter: /\.css$/, namespace: "file" }, async (args) => {
        let contents = await fse.readFile(args.path, "utf-8");

        contents = (
          await postcssProcessor.process(contents, {
            from: args.path,
            to: args.path,
            map: options.sourcemap,
          })
        ).css;

        return {
          contents,
          loader: "css",
        };
      });
    },
  };
}
