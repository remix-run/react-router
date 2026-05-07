import path from "pathe";
import type { ResolvedReactRouterConfig } from "../config/config";
import type { RouteManifestEntry } from "../config/routes";
import { getVite } from "./vite";

export function resolveRelativeRouteFilePath(
  route: RouteManifestEntry,
  reactRouterConfig: ResolvedReactRouterConfig,
) {
  let vite = getVite();
  let file = route.file;
  let fullPath = path.resolve(reactRouterConfig.appDirectory, file);
  return vite.normalizePath(fullPath);
}
