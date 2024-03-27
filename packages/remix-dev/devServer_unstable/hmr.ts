import path from "node:path";

import type { RemixConfig } from "../config";
import { type Manifest } from "../manifest";

export type Update = {
  id: string;
  routeId: string;
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
  prevManifest: Manifest,
  hdr: Record<string, string>,
  prevHdr?: Record<string, string>
): Update[] => {
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
        routeId: route.id,
        url: route.module,
        revalidate: true,
        reason: "Route added",
      });
      continue;
    }

    // when loaders are diff
    let loaderHash = hdr[file];
    let prevLoaderHash = prevHdr?.[file];
    if (loaderHash !== prevLoaderHash) {
      updates.push({
        id: moduleId,
        routeId: route.id,
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
        routeId: route.id,
        url: route.module,
        revalidate: false,
        reason: "Component changed",
      });
      continue;
    }
  }
  return updates;
};
