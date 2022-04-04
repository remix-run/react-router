import { readFile } from "fs/promises";
import glob from "fast-glob";
import { join } from "path";
import type { PackageJson } from "type-fest";

import * as jscodeshift from "../../jscodeshift";
import { cleanupPackageJson } from "./cleanupPackageJson";
import { getTransformOptions } from "./getTransformOptions";
import type { ExtraOptions } from "./transform";
import type { MigrationFunction } from "../../types";

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

  let files = glob.sync("**/*.+(js|jsx|ts|tsx)", {
    cwd: projectDir,
    absolute: true,
  });

  return jscodeshift.run<ExtraOptions>({
    transformPath,
    files,
    flags,
    transformOptions,
  });
};
