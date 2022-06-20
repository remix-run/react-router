import type { PackageJson } from "@npmcli/package-json";
import NpmCliPackageJson from "@npmcli/package-json";

const removeUnusedDevDependencies = (
  devDependencies: PackageJson["devDependencies"] = {}
) =>
  Object.fromEntries(
    Object.entries(devDependencies).filter(
      ([name]) => !name.startsWith("@types/") && name !== "typescript"
    )
  );

export const cleanupPackageJson = async (projectDir: string) => {
  let packageJson = await NpmCliPackageJson.load(projectDir);

  let { devDependencies, scripts: { typecheck, ...scripts } = {} } =
    packageJson.content;
  packageJson.update({
    devDependencies: removeUnusedDevDependencies(devDependencies),
    scripts,
  });

  // write updates to package.json
  return packageJson.save();
};
