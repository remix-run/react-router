import * as path from "node:path";
import esbuild from "esbuild";

import type { Context } from "../compiler/context";
import { emptyModulesPlugin } from "../compiler/plugins/emptyModules";
import { externalPlugin } from "../compiler/plugins/external";
import { getRouteModuleExports } from "../compiler/utils/routeExports";
import { createMatchPath } from "../compiler/utils/tsconfig";
import invariant from "../invariant";
import { mdxPlugin } from "../compiler/plugins/mdx";
import { loaders } from "../compiler/utils/loaders";

function isBareModuleId(id: string): boolean {
  return !id.startsWith("node:") && !id.startsWith(".") && !path.isAbsolute(id);
}

type Route = Context["config"]["routes"][string];

export let detectLoaderChanges = async (
  ctx: Context
): Promise<Record<string, string>> => {
  let entryPoints: Record<string, string> = {};
  for (let id of Object.keys(ctx.config.routes)) {
    entryPoints[id] = ctx.config.routes[id].file + "?loader";
  }
  let options: esbuild.BuildOptions = {
    bundle: true,
    entryPoints: entryPoints,
    treeShaking: true,
    metafile: true,
    outdir: ".",
    write: false,
    entryNames: "[hash]",
    loader: loaders,
    logLevel: "silent",
    plugins: [
      {
        name: "hmr-loader",
        setup(build) {
          let routesByFile: Map<string, Route> = Object.keys(
            ctx.config.routes
          ).reduce((map, key) => {
            let route = ctx.config.routes[key];
            map.set(route.file, route);
            return map;
          }, new Map());
          let filter = /\?loader$/;
          build.onResolve({ filter }, (args) => {
            return { path: args.path, namespace: "hmr-loader" };
          });
          build.onLoad({ filter, namespace: "hmr-loader" }, async (args) => {
            let file = args.path.replace(filter, "");
            let route = routesByFile.get(file);
            invariant(route, `Cannot get route by path: ${args.path}`);
            let cacheKey = `module-exports:${route.id}`;
            let { cacheValue: theExports } = await ctx.fileWatchCache.getOrSet(
              cacheKey,
              async () => {
                let file = path.resolve(
                  ctx.config.appDirectory,
                  ctx.config.routes[route!.id].file
                );
                return {
                  cacheValue: await getRouteModuleExports(
                    ctx.config,
                    route!.id
                  ),
                  fileDependencies: new Set([file]),
                };
              }
            );

            let contents = "module.exports = {};";
            if (
              theExports.includes("loader") &&
              theExports.includes("clientLoader")
            ) {
              contents = `export { loader, clientLoader } from ${JSON.stringify(
                `./${file}`
              )};`;
            } else if (theExports.includes("loader")) {
              contents = `export { loader } from ${JSON.stringify(
                `./${file}`
              )};`;
            } else if (theExports.includes("clientLoader")) {
              contents = `export { clientLoader } from ${JSON.stringify(
                `./${file}`
              )};`;
            }

            return {
              contents,
              resolveDir: ctx.config.appDirectory,
              loader: "js",
            };
          });
        },
      },
      externalPlugin(/^node:.*/, { sideEffects: false }),
      externalPlugin(/\.css$/, { sideEffects: false }),
      externalPlugin(/^https?:\/\//, { sideEffects: false }),
      mdxPlugin(ctx),
      emptyModulesPlugin(ctx, /\.client(\.[jt]sx?)?$/),
      {
        name: "hmr-bare-modules",
        setup(build) {
          let matchPath = ctx.config.tsconfigPath
            ? createMatchPath(ctx.config.tsconfigPath)
            : undefined;
          function resolvePath(id: string) {
            if (!matchPath) return id;
            return (
              matchPath(id, undefined, undefined, [
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
              ]) || id
            );
          }
          build.onResolve({ filter: /.*/ }, (args) => {
            if (!isBareModuleId(resolvePath(args.path))) {
              return undefined;
            }
            return { path: args.path, external: true };
          });
        },
      },
    ],
  };

  let { metafile } = await esbuild.build(options);

  let entries: Record<string, string> = {};
  for (let [hashjs, { entryPoint }] of Object.entries(metafile!.outputs)) {
    if (entryPoint === undefined) continue;
    let file = entryPoint.replace(/^hmr-loader:/, "").replace(/\?loader$/, "");
    entries[file] = hashjs.replace(/\.js$/, "");
  }

  return entries;
};
