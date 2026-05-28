import * as Vite from "vite";
import { escapePath as escapePathAsGlob } from "tinyglobby";
import type { ResolvedReactRouterConfig } from "../config/config";
import { resolveRelativeRouteFilePath } from "./resolve-relative-route-file-path";

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

  // In Vite 7+, the `optimizeDeps.entries` option only accepts glob patterns.
  return [
    Vite.normalizePath(entryClientFilePath),
    ...Object.values(reactRouterConfig.routes).map((route) =>
      resolveRelativeRouteFilePath(route, reactRouterConfig),
    ),
  ].map((entry) => escapePathAsGlob(entry));
}
