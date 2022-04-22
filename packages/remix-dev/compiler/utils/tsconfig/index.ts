import tsConfigPaths from "tsconfig-paths";

import { loadTsConfig } from "./configLoader";
import { writeConfigDefaults } from "./write-config-defaults";
export { loadTsConfig } from "./configLoader";

export function createMatchPath() {
  let configLoaderResult = loadTsConfig();
  if (configLoaderResult.resultType === "failed") {
    if (configLoaderResult.message === "Missing baseUrl in compilerOptions") {
      throw new Error(
        `🚨 Oops! No baseUrl found, please set compilerOptions.baseUrl in your tsconfig or jsconfig`
      );
    }
    return undefined;
  }

  writeConfigDefaults(configLoaderResult.configFileAbsolutePath);

  return tsConfigPaths.createMatchPath(
    configLoaderResult.absoluteBaseUrl,
    configLoaderResult.paths,
    configLoaderResult.mainFields,
    configLoaderResult.addMatchAll
  );
}
