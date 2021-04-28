import * as path from "path";
// @ts-expect-error
import readPackageJson from "read-package-json-fast";

import type { RemixConfig } from "../config";

type PackageDependencies = { [packageName: string]: string };

export async function getPackageDependencies(
  packageJsonFile: string
): Promise<PackageDependencies> {
  return (await readPackageJson(packageJsonFile)).dependencies;
}

export function getAppDependencies(
  config: RemixConfig
): Promise<PackageDependencies> {
  return getPackageDependencies(
    path.resolve(config.rootDirectory, "package.json")
  );
}
