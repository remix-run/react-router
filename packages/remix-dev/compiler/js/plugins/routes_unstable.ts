import * as fs from "node:fs";
import * as path from "node:path";
import type esbuild from "esbuild";
import generate from "@babel/generator";

import { routeModuleExts } from "../../../config/routesConvention";
import * as Transform from "../../../transform";
import { getLoaderForFile } from "../../utils/loaders";
import { applyHMR } from "./hmr";
import type { Context } from "../../context";
import { processMDX } from "../../plugins/mdx";

const serverOnlyExports = new Set(["action", "loader"]);

let removeServerExports = (onLoader: (loader: string) => void) =>
  Transform.create(({ types: t }) => {
    return {
      visitor: {
        ExportNamedDeclaration: (path) => {
          let { node } = path;
          if (node.source) {
            let specifiers = node.specifiers.filter(({ exported }) => {
              let name = t.isIdentifier(exported)
                ? exported.name
                : exported.value;
              return !serverOnlyExports.has(name);
            });
            if (specifiers.length === node.specifiers.length) return;
            if (specifiers.length === 0) return path.remove();
            path.replaceWith(
              t.exportNamedDeclaration(
                node.declaration,
                specifiers,
                node.source
              )
            );
          }
          if (t.isFunctionDeclaration(node.declaration)) {
            let name = node.declaration.id?.name;
            if (!name) return;
            if (name === "loader") {
              let { code } = generate(node);
              onLoader(code);
            }
            if (serverOnlyExports.has(name)) return path.remove();
          }
          if (t.isVariableDeclaration(node.declaration)) {
            let declarations = node.declaration.declarations.filter((d) => {
              let name = t.isIdentifier(d.id) ? d.id.name : undefined;
              if (!name) return false;
              if (name === "loader") {
                let { code } = generate(node);
                onLoader(code);
              }
              return !serverOnlyExports.has(name);
            });
            if (declarations.length === 0) return path.remove();
            if (declarations.length === node.declaration.declarations.length)
              return;
            path.replaceWith(
              t.variableDeclaration(node.declaration.kind, declarations)
            );
          }
        },
      },
    };
  });

/**
 * This plugin loads route modules for the browser build, using module shims
 * that re-export only the route module exports that are safe for the browser.
 */
export function browserRouteModulesPlugin(
  { config, options }: Context,
  routeModulePaths: Map<string, string>,
  onLoader: (filename: string, code: string) => void
): esbuild.Plugin {
  return {
    name: "browser-route-modules",
    async setup(build) {
      let [xdm, { default: remarkFrontmatter }] = await Promise.all([
        import("xdm"),
        import("remark-frontmatter") as any,
      ]);

      build.onResolve({ filter: /.*/ }, (args) => {
        // We have to map all imports from route modules back to the virtual
        // module in the graph otherwise we will be duplicating portions of
        // route modules across the build.
        let routeModulePath = routeModulePaths.get(args.path);
        if (!routeModulePath && args.resolveDir && args.path.startsWith(".")) {
          let lookup = resolvePath(path.join(args.resolveDir, args.path));
          routeModulePath = routeModulePaths.get(lookup);
        }
        if (!routeModulePath) return;
        return {
          path: routeModulePath,
          namespace: "browser-route-module",
        };
      });

      let cache = new Map();

      build.onLoad(
        { filter: /.*/, namespace: "browser-route-module" },
        async (args) => {
          let file = args.path;
          let routeFile = path.resolve(config.appDirectory, file);

          if (/\.mdx?$/.test(file)) {
            let mdxResult = await processMDX(
              xdm,
              remarkFrontmatter,
              config,
              args.path,
              routeFile
            );
            if (!mdxResult.contents || mdxResult.errors?.length) {
              return mdxResult;
            }

            let transform = removeServerExports((loader: string) =>
              onLoader(routeFile, loader)
            );
            mdxResult.contents = transform(
              mdxResult.contents,
              // Trick babel into allowing JSX syntax.
              args.path + ".jsx"
            );
            return mdxResult;
          }

          let sourceCode = fs.readFileSync(routeFile, "utf8");

          let value = cache.get(file);
          if (!value || value.sourceCode !== sourceCode) {
            let extractedLoader;
            let transform = removeServerExports(
              (loader: string) => (extractedLoader = loader)
            );
            let contents = transform(sourceCode, routeFile);

            if (options.mode === "development" && config.future.unstable_dev) {
              contents = await applyHMR(
                contents,
                {
                  ...args,
                  path: routeFile,
                },
                config,
                !!build.initialOptions.sourcemap
              );
            }
            value = {
              sourceCode,
              extractedLoader,
              output: {
                contents,
                loader: getLoaderForFile(routeFile),
                resolveDir: path.dirname(routeFile),
              },
            };
            cache.set(file, value);
          }

          if (value.extractedLoader) {
            onLoader(routeFile, value.extractedLoader);
          }

          return value.output;
        }
      );
    },
  };
}

function resolvePath(path: string) {
  if (fs.existsSync(path) && fs.statSync(path).isFile()) {
    return path;
  }

  for (let ext of routeModuleExts) {
    let withExt = path + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  return path;
}
