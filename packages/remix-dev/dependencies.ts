import * as fs from "node:fs";
import * as path from "node:path";

import type { RemixConfig } from "./config";

type PackageDependencies = { [packageName: string]: string };

function getPackageDependencies(
  packageJsonFile: string,
  includeDev?: boolean
): PackageDependencies {
  let pkg = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"));
  let deps = pkg?.dependencies || {};

  if (includeDev) {
    Object.assign(deps, pkg?.devDependencies || {});
  }

  return deps;
}

export function getAppDependencies(
  config: RemixConfig,
  includeDev?: boolean
): PackageDependencies {
  return getPackageDependencies(
    path.resolve(config.rootDirectory, "package.json"),
    includeDev
  );
}

export function getDependenciesToBundle(...pkg: string[]): string[] {
  let aggregatedDeps = new Set<string>(pkg);
  let visitedPackages = new Set<string>();

  pkg.forEach((p) => {
    getPackageDependenciesRecursive(p, aggregatedDeps, visitedPackages);
  });

  return Array.from(aggregatedDeps);
}

interface ErrorWithCode extends Error {
  code: string;
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    error instanceof Error &&
    typeof (error as NodeJS.ErrnoException).code === "string"
  );
}

function getPackageDependenciesRecursive(
  pkg: string,
  aggregatedDeps: Set<string>,
  visitedPackages: Set<string>
): void {
  visitedPackages.add(pkg);

  let pkgPath: string;
  try {
    pkgPath = require.resolve(pkg, { paths: [__dirname, process.cwd()] });
  } catch (err) {
    if (isErrorWithCode(err) && err.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      // Handle packages without main exports.
      // They at least need to have package.json exported.
      pkgPath = require.resolve(`${pkg}/package.json`, {
        paths: [__dirname, process.cwd()],
      });
    } else {
      throw err;
    }
  }
  let lastIndexOfPackageName = pkgPath.lastIndexOf(pkg);
  if (lastIndexOfPackageName !== -1) {
    pkgPath = pkgPath.substring(0, lastIndexOfPackageName);
  }
  let pkgJson = path.join(pkgPath, "package.json");
  if (!fs.existsSync(pkgJson)) {
    console.log(pkgJson, `does not exist`);
    return;
  }

  let dependencies = getPackageDependencies(pkgJson);

  Object.keys(dependencies).forEach((dep) => {
    aggregatedDeps.add(dep);
    if (!visitedPackages.has(dep)) {
      getPackageDependenciesRecursive(dep, aggregatedDeps, visitedPackages);
    }
  });
}
