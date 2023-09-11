import path from "node:path";
import type { Plugin } from "esbuild";
import fse from "fs-extra";
import { parse, type ParserOptions } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";

import { getCachedPostcssProcessor } from "../utils/postcss";
import { applyHMR } from "../js/plugins/hmr";
import type { Context } from "../context";

const pluginName = "css-side-effects-plugin";
const namespace = `${pluginName}-ns`;
const cssSideEffectSuffix = "?__remix_sideEffect__";
const cssSideEffectFilter = new RegExp(
  `\\.css${cssSideEffectSuffix.replace("?", "\\?")}$`
);

export function isCssSideEffectImportPath(path: string): boolean {
  return cssSideEffectFilter.test(path);
}

const extensions = ["js", "jsx", "ts", "tsx", "mjs", "cjs"] as const;
const allJsFilesFilter = new RegExp(`\\.(${extensions.join("|")})$`);

type Loader = "js" | "jsx" | "ts" | "tsx";
type Extension = `.${typeof extensions[number]}`;

const loaderForExtension: Record<Extension, Loader> = {
  ".js": "jsx", // Remix supports JSX in JS files
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
  ".mjs": "js",
  ".cjs": "js",
};

/**
 * This plugin detects side-effect imports of CSS files and adds a suffix
 * to the import path, e.g. `import "./styles.css"` is transformed to
 * `import "./styles.css?__remix_sideEffect__"`). This allows them to be
 * differentiated from non-side-effect imports so that they can be added
 * to the CSS bundle. This is primarily designed to support packages that
 * import plain CSS files directly within JS files.
 */
export const cssSideEffectImportsPlugin = (
  ctx: Context,
  { hmr = false } = {}
): Plugin => {
  return {
    name: pluginName,
    setup: async (build) => {
      build.onLoad(
        { filter: allJsFilesFilter, namespace: "file" },
        async (args) => {
          let cacheKey = `css-side-effect-imports-plugin:${args.path}&hmr=${hmr}`;
          let { cacheValue } = await ctx.fileWatchCache.getOrSet(
            cacheKey,
            async () => {
              let fileDependencies = new Set([args.path]);

              let code = await fse.readFile(args.path, "utf8");

              // Don't process file if it doesn't contain any references to CSS files
              if (!code.includes(".css")) {
                return {
                  fileDependencies,
                  cacheValue: null,
                };
              }

              let loader =
                loaderForExtension[path.extname(args.path) as Extension];
              let contents = addSuffixToCssSideEffectImports(loader, code);

              if (args.path.startsWith(ctx.config.appDirectory) && hmr) {
                contents = await applyHMR(
                  contents,
                  args,
                  ctx.config,
                  !!build.initialOptions.sourcemap
                );
              }

              return {
                fileDependencies,
                cacheValue: {
                  contents,
                  loader,
                },
              };
            }
          );

          if (!cacheValue) {
            return null;
          }

          return {
            contents: cacheValue.contents,
            loader: cacheValue.loader,
          };
        }
      );

      build.onResolve(
        { filter: cssSideEffectFilter, namespace: "file" },
        async (args) => {
          let resolvedPath = (
            await build.resolve(args.path, {
              resolveDir: args.resolveDir,
              kind: args.kind,
            })
          ).path;

          // If the resolved path isn't a CSS file then we don't want
          // to handle it. In our case this is specifically done to
          // avoid matching Vanilla Extract's .css.ts/.js files.
          if (!resolvedPath.split("?")[0].endsWith(".css")) {
            return null;
          }

          return {
            path: path.relative(ctx.config.rootDirectory, resolvedPath),
            namespace,
          };
        }
      );

      build.onLoad({ filter: /\.css$/, namespace }, async (args) => {
        let absolutePath = path.resolve(ctx.config.rootDirectory, args.path);
        let postcssProcessor = await getCachedPostcssProcessor(ctx);

        return {
          contents: postcssProcessor
            ? await postcssProcessor({ path: absolutePath })
            : await fse.readFile(absolutePath, "utf8"),
          resolveDir: path.dirname(absolutePath),
          loader: "css",
        };
      });
    },
  };
};

const additionalLanguageFeatures: ParserOptions["plugins"] = ["decorators"];

const babelPluginsForLoader: Record<Loader, ParserOptions["plugins"]> = {
  js: ["jsx", ...additionalLanguageFeatures], // Remix supports JSX in JS files
  jsx: ["jsx", ...additionalLanguageFeatures],
  ts: ["typescript", ...additionalLanguageFeatures],
  tsx: ["typescript", "jsx", ...additionalLanguageFeatures],
};

export function addSuffixToCssSideEffectImports(
  loader: Loader,
  code: string
): string {
  let ast = parse(code, {
    sourceType: "module",
    plugins: babelPluginsForLoader[loader],
  });

  traverse(ast, {
    // Handle `import "./styles.css"`
    ImportDeclaration(path) {
      if (
        path.node.specifiers.length === 0 && // i.e. nothing was imported
        path.node.source.value.endsWith(".css")
      ) {
        path.node.source.value += cssSideEffectSuffix;
      }
    },

    // Handle `require("./styles.css")`
    CallExpression(path) {
      if (
        path.node.callee.type === "Identifier" &&
        path.node.callee.name === "require" &&
        // Require call must be its own statement,
        // not nested within another expression,
        (path.parent.type === "ExpressionStatement" ||
          // or, the statement must only consist of a
          // ternary or logical expression, without
          // assigning the result to a variable.
          ((path.parent.type === "ConditionalExpression" ||
            path.parent.type === "LogicalExpression") &&
            path.parentPath.parent.type === "ExpressionStatement"))
      ) {
        let specifier = path.node.arguments[0];

        if (
          specifier &&
          specifier.type === "StringLiteral" &&
          specifier.value.endsWith(".css")
        ) {
          specifier.value += cssSideEffectSuffix;
        }
      }
    },
  });

  let result = generate(ast, {
    retainLines: true,
    compact: false,
  }).code;

  return result;
}
