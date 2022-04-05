import { readFile } from "fs/promises";
import glob from "fast-glob";
import { join } from "path";
import type { PackageJson } from "type-fest";

import * as jscodeshift from "../../jscodeshift";
import { cleanupPackageJson } from "./cleanupPackageJson";
import { getTransformOptions } from "./getTransformOptions";
import type { Options } from "./transform";
import type { MigrationFunction } from "../../types";
import { readConfig } from "../../../../config";

const transformPath = join(__dirname, "transform");

export const replaceRemixImports: MigrationFunction = async ({
  projectDir,
  flags,
}) => {
  let pkgJsonPath = join(projectDir, "package.json");
  let packageJson: PackageJson = JSON.parse(
    await readFile(pkgJsonPath, "utf-8")
  );
  let transformOptions = getTransformOptions(packageJson);

  await cleanupPackageJson({
    content: packageJson,
    path: pkgJsonPath,
    runtime: transformOptions.runtime,
  });

  // find all Javascript and Typescript files within Remix app directory
  let config = await readConfig(projectDir);
  let files = glob.sync("**/*.+(js|jsx|ts|tsx)", {
    cwd: config.appDirectory,
    absolute: true,
  });

  return jscodeshift.run<Options>({
    transformPath,
    files,
    flags,
    transformOptions,
  });
};
