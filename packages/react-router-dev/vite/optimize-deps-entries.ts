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

  // In Vite 7+, the `optimizeDeps.entries` option only accepts glob patterns.
  return [
    vite.normalizePath(entryClientFilePath),
    ...Object.values(reactRouterConfig.routes).map((route) =>
      resolveRelativeRouteFilePath(route, reactRouterConfig),
    ),
  ].map((entry) => escapePathAsGlob(entry));
}
