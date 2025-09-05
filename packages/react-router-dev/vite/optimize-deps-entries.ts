import { escapePath as escapePathAsGlob } from "tinyglobby";
import type { ResolvedReactRouterConfig } from "../config/config";
import { resolveRelativeRouteFilePath } from "./resolve-relative-route-file-path";
import { getVite } from "./vite";

export function getOptimizeDepsEntries({
  entryClientFilePath,
  reactRouterConfig,
}: {
  entryClientFilePath: string;
  reactRouterConfig: ResolvedReactRouterConfig;
}) {
  if (!reactRouterConfig.future.unstable_optimizeDeps) {
    return [];
  }

  const vite = getVite();
  const viteMajorVersion = parseInt(vite.version.split(".")[0], 10);

  return [
    vite.normalizePath(entryClientFilePath),
    ...Object.values(reactRouterConfig.routes).map((route) =>
      resolveRelativeRouteFilePath(route, reactRouterConfig),
    ),
  ].map((entry) =>
    // In Vite 7, the `optimizeDeps.entries` option only accepts glob patterns.
    // In prior versions, absolute file paths were treated differently.
    viteMajorVersion >= 7 ? escapePathAsGlob(entry) : entry,
  );
}
