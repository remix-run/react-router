import * as Vite from "vite";
import path from "pathe";
import type { ResolvedReactRouterConfig } from "../config/config";
import type { RouteManifestEntry } from "../config/routes";

export function resolveRelativeRouteFilePath(
  route: RouteManifestEntry,
  reactRouterConfig: ResolvedReactRouterConfig,
) {
  let file = route.file;
  let fullPath = path.resolve(reactRouterConfig.appDirectory, file);
  return Vite.normalizePath(fullPath);
}
