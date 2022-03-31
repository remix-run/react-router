import { readFile } from "fs/promises";
import { join } from "path";
import type { PackageJson } from "type-fest";

import { JSCodeshiftTransform } from "../jscodeshift-transform";
import type { Transform } from "../types";
import { cleanupPackageJson } from "./cleanup-package-json";
import { getJSCodeshiftExtraOptions } from "./get-jscodeshift-extra-options";
import type { ExtraOptions } from "./jscodeshift-transform";

const transformPath = join(__dirname, "jscodeshift-transform");

export const updateRemixImports: Transform = async ({
  answers,
  files,
  flags,
}) => {
  let pkgJsonPath = join(answers.projectDir, "package.json");
  let packageJson: PackageJson = JSON.parse(
    await readFile(pkgJsonPath, "utf-8")
  );

  await cleanupPackageJson({ content: packageJson, path: pkgJsonPath });

  return JSCodeshiftTransform<ExtraOptions>({
    extraOptions: getJSCodeshiftExtraOptions(packageJson),
    files,
    flags,
    transformPath,
  });
};

// escape-hatch to include these files in the build
export * as JSCodeshiftTransform from "./jscodeshift-transform";
