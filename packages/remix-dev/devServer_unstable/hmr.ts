import path from "node:path";

import type { RemixConfig } from "../config";
import { type Manifest } from "../manifest";

export type Update = {
  id: string;
  url: string;
  revalidate: boolean;
  reason: string;
};

// route id: filepaths relative to app/ dir without extension
// filename: absolute or relative to root for things we don't handle
// for things we handle: relative to app dir
export let updates = (
  config: RemixConfig,
  manifest: Manifest,
  prevManifest: Manifest
): Update[] => {
  // TODO: probably want another map to correlate every input file to the
  // routes that consume it
  // ^check if route chunk hash changes when its dependencies change, even in different chunks

  let updates: Update[] = [];
  for (let [routeId, route] of Object.entries(manifest.routes)) {
    let prevRoute = prevManifest.routes[routeId] as typeof route | undefined;
    let file = config.routes[routeId].file;
    let moduleId = path.relative(
      config.rootDirectory,
      path.join(config.appDirectory, file)
    );

    // new route
    if (!prevRoute) {
      updates.push({
        id: moduleId,
        url: route.module,
        revalidate: true,
        reason: "Route added",
      });
      continue;
    }

    // when loaders are diff
    let loaderHash = manifest.hmr?.routes[moduleId]?.loaderHash;
    let prevLoaderHash = prevManifest.hmr?.routes[moduleId]?.loaderHash;
    if (loaderHash !== prevLoaderHash) {
      updates.push({
        id: moduleId,
        url: route.module,
        revalidate: true,
        reason: "Loader changed",
      });
      continue;
    }

    // when fingerprinted assets are diff (self or imports)
    let diffModule = route.module !== prevRoute.module;
    let xorImports = new Set(route.imports ?? []);
    prevRoute.imports?.forEach(xorImports.delete.bind(xorImports));
    if (diffModule || xorImports.size > 0) {
      updates.push({
        id: moduleId,
        url: route.module,
        revalidate: false,
        reason: "Component changed",
      });
      continue;
    }
  }
  return updates;
};
