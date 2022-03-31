import tsConfigPaths from "tsconfig-paths";

import { loadTsConfig } from "./configLoader";
export { loadTsConfig } from "./configLoader";

export function createMatchPath() {
  let configLoaderResult = loadTsConfig();
  if (configLoaderResult.resultType === "failed") {
    return undefined;
  }

  let matchPath = tsConfigPaths.createMatchPath(
    configLoaderResult.absoluteBaseUrl,
    configLoaderResult.paths,
    configLoaderResult.mainFields,
    configLoaderResult.addMatchAll
  );

  return matchPath;
}
