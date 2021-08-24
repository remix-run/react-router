import * as fse from "fs-extra";
import * as path from "path";

export enum SetupPlatform {
  Node = "node"
}

export function isSetupPlatform(platform: any): platform is SetupPlatform {
  return platform === SetupPlatform.Node;
}

export async function installMagicExports(
  dependencies: { [name: string]: string },
  filesDir: string
): Promise<void> {
  let remixDir = path.dirname(require.resolve("remix"));
  let packageJsonFile = path.resolve(remixDir, "package.json");
  await fse.copy(filesDir, remixDir);
  await fse.writeJson(
    packageJsonFile,
    assignDependencies(await fse.readJson(packageJsonFile), dependencies),
    { spaces: 2 }
  );
}

function assignDependencies(
  object: any,
  dependencies: { [name: string]: string }
): typeof object {
  if (!object.dependencies) {
    object.dependencies = {};
  }

  Object.assign(object.dependencies, dependencies);

  return object;
}
