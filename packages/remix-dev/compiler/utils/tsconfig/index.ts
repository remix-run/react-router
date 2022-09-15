import tsConfigPaths from "tsconfig-paths";

export function createMatchPath(tsconfigPath: string | undefined) {
  // There is no tsconfig to match paths against.
  if (!tsconfigPath) {
    return undefined;
  }

  // When passing a absolute path, loadConfig assumes that the path contains
  // a tsconfig file.
  // Ref.: https://github.com/dividab/tsconfig-paths/blob/v4.0.0/src/__tests__/config-loader.test.ts#L74
  let configLoaderResult = tsConfigPaths.loadConfig(tsconfigPath);

  if (configLoaderResult.resultType === "failed") {
    if (configLoaderResult.message === "Missing baseUrl in compilerOptions") {
      throw new Error(
        `🚨 Oops! No baseUrl found, please set compilerOptions.baseUrl in your tsconfig or jsconfig`
      );
    }
    return undefined;
  }

  return tsConfigPaths.createMatchPath(
    configLoaderResult.absoluteBaseUrl,
    configLoaderResult.paths,
    configLoaderResult.mainFields,
    configLoaderResult.addMatchAll
  );
}
