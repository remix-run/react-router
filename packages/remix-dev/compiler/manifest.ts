import * as path from "node:path";
import { promises as fsp } from "node:fs";
import type * as esbuild from "esbuild";

import type { RemixConfig } from "../config";
import invariant from "../invariant";
import { type Manifest } from "../manifest";
import { getRouteModuleExports } from "./utils/routeExports";
import { getHash } from "./utils/crypto";
import { type FileWatchCache } from "./fileWatchCache";

type Route = RemixConfig["routes"][string];

export async function create({
  config,
  metafile,
  hmr,
  fileWatchCache,
}: {
  config: RemixConfig;
  metafile: esbuild.Metafile;
  hmr?: Manifest["hmr"];
  fileWatchCache: FileWatchCache;
}): Promise<Manifest> {
  function resolveUrl(outputPath: string): string {
    return createUrl(
      config.publicPath,
      path.relative(config.assetsBuildDirectory, path.resolve(outputPath))
    );
  }

  function resolveImports(
    imports: esbuild.Metafile["outputs"][string]["imports"]
  ): string[] {
    return imports
      .filter((im) => im.kind === "import-statement")
      .map((im) => resolveUrl(im.path));
  }

  let routesByFile: Map<string, Route[]> = Object.keys(config.routes).reduce(
    (map, key) => {
      let route = config.routes[key];
      map.set(
        route.file,
        map.has(route.file) ? [...map.get(route.file), route] : [route]
      );
      return map;
    },
    new Map()
  );

  let entry: Manifest["entry"] | undefined;
  let routes: Manifest["routes"] = {};

  for (let key of Object.keys(metafile.outputs).sort()) {
    let output = metafile.outputs[key];
    if (!output.entryPoint) continue;

    if (path.resolve(output.entryPoint) === config.entryClientFilePath) {
      entry = {
        module: resolveUrl(key),
        imports: resolveImports(output.imports),
      };
      // Only parse routes otherwise dynamic imports can fall into here and fail the build
    } else if (output.entryPoint.startsWith("browser-route-module:")) {
      let entryPointFile = output.entryPoint.replace(
        /(^browser-route-module:|\?browser$)/g,
        ""
      );
      let groupedRoute = routesByFile.get(entryPointFile);
      invariant(
        groupedRoute,
        `Cannot get route(s) for entry point ${output.entryPoint}`
      );
      for (let route of groupedRoute) {
        let cacheKey = `module-exports:${route.id}`;
        let { cacheValue: sourceExports } = await fileWatchCache.getOrSet(
          cacheKey,
          async () => {
            let file = path.resolve(
              config.appDirectory,
              config.routes[route.id].file
            );
            return {
              cacheValue: await getRouteModuleExports(config, route.id),
              fileDependencies: new Set([file]),
            };
          }
        );

        routes[route.id] = {
          id: route.id,
          parentId: route.parentId,
          path: route.path,
          index: route.index,
          caseSensitive: route.caseSensitive,
          module: resolveUrl(key),
          imports: resolveImports(output.imports),
          hasAction: sourceExports.includes("action"),
          hasLoader: sourceExports.includes("loader"),
          hasClientAction: sourceExports.includes("clientAction"),
          hasClientLoader: sourceExports.includes("clientLoader"),
          hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
        };
      }
    }
  }

  invariant(entry, `Missing output for entry point`);

  optimizeRoutes(routes, entry.imports);

  let fingerprintedValues = {
    entry,
    routes,
  };

  let version = getHash(JSON.stringify(fingerprintedValues)).slice(0, 8);

  let nonFingerprintedValues = {
    version,
    hmr,
  };

  return {
    ...fingerprintedValues,
    ...nonFingerprintedValues,
  };
}

export const write = async (config: RemixConfig, assetsManifest: Manifest) => {
  let filename = `manifest-${assetsManifest.version.toUpperCase()}.js`;

  assetsManifest.url = config.publicPath + filename;

  await writeFileSafe(
    path.join(config.assetsBuildDirectory, filename),
    `window.__remixManifest=${JSON.stringify(assetsManifest)};`
  );
};

async function writeFileSafe(file: string, contents: string): Promise<string> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, contents);
  return file;
}

function createUrl(publicPath: string, file: string): string {
  return publicPath + file.split(path.win32.sep).join("/");
}

type ImportsCache = { [routeId: string]: string[] };

function optimizeRoutes(
  routes: Manifest["routes"],
  entryImports: string[]
): void {
  // This cache is an optimization that allows us to avoid pruning the same
  // route's imports more than once.
  let importsCache: ImportsCache = Object.create(null);

  for (let key in routes) {
    optimizeRouteImports(key, routes, entryImports, importsCache);
  }
}

function optimizeRouteImports(
  routeId: string,
  routes: Manifest["routes"],
  parentImports: string[],
  importsCache: ImportsCache
): string[] {
  if (importsCache[routeId]) return importsCache[routeId];

  let route = routes[routeId];

  if (route.parentId) {
    parentImports = parentImports.concat(
      optimizeRouteImports(route.parentId, routes, parentImports, importsCache)
    );
  }

  let routeImports = (route.imports || []).filter(
    (url) => !parentImports.includes(url)
  );

  // Setting `route.imports = undefined` prevents `imports: []` from showing up
  // in the manifest JSON when there are no imports.
  route.imports = routeImports.length > 0 ? routeImports : undefined;

  // Cache so the next lookup for this route is faster.
  importsCache[routeId] = routeImports;

  return routeImports;
}
