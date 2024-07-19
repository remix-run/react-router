import fs from "node:fs";
import path from "node:path";
import type { RouteManifestFunction } from "@react-router/dev";

import { fileRoutes } from "./fileRoutes";

export function remixRoutes({
  ignoredRouteFiles,
  rootDirectory = "routes",
}: {
  ignoredRouteFiles?: string[];
  rootDirectory?: string;
} = {}): RouteManifestFunction {
  return ({ appDirectory }) => {
    if (!fs.existsSync(path.resolve(appDirectory, rootDirectory))) {
      return {};
    }

    return fileRoutes(appDirectory, ignoredRouteFiles, rootDirectory);
  };
}
