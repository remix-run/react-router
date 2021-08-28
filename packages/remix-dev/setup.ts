import * as fse from "fs-extra";
import * as path from "path";

export enum SetupPlatform {
  Node = "node"
}

export function isSetupPlatform(platform: any): platform is SetupPlatform {
  return platform === SetupPlatform.Node;
}

export async function setupRemix(platform: SetupPlatform): Promise<void> {
  let remixPkgJsonFile: string;
  try {
    remixPkgJsonFile = resolvePackageJsonFile("remix");
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      console.error(
        `Missing the "remix" package. Please run \`npm install remix\` before \`remix setup\`.`
      );

      return;
    } else {
      throw error;
    }
  }

  let platformPkgJsonFile = resolvePackageJsonFile(`@remix-run/${platform}`);
  let serverPkgJsonFile = resolvePackageJsonFile(`@remix-run/server-runtime`);
  let clientPkgJsonFile = resolvePackageJsonFile(`@remix-run/react`);

  // Update remix/package.json dependencies
  let remixDeps = {};
  await assignDependency(remixDeps, platformPkgJsonFile);
  await assignDependency(remixDeps, serverPkgJsonFile);
  await assignDependency(remixDeps, clientPkgJsonFile);

  let remixPkgJson = await fse.readJSON(remixPkgJsonFile);
  // We can overwrite all dependencies at once because the remix package
  // doesn't actually have any dependencies.
  remixPkgJson.dependencies = remixDeps;

  await fse.writeJSON(remixPkgJsonFile, remixPkgJson, { spaces: 2 });

  // Copy magicExports directories to remix
  let remixPkgDir = path.dirname(remixPkgJsonFile);
  let platformExportsDir = path.resolve(
    platformPkgJsonFile,
    "..",
    "magicExports"
  );
  let serverExportsDir = path.resolve(serverPkgJsonFile, "..", "magicExports");
  let clientExportsDir = path.resolve(clientPkgJsonFile, "..", "magicExports");

  await Promise.all([
    fse.copy(platformExportsDir, remixPkgDir),
    fse.copy(serverExportsDir, remixPkgDir),
    fse.copy(clientExportsDir, remixPkgDir)
  ]);
}

function resolvePackageJsonFile(packageName: string): string {
  return require.resolve(path.join(packageName, "package.json"));
}

async function assignDependency(
  deps: { [key: string]: string },
  pkgJsonFile: string
) {
  let pkgJson = await fse.readJSON(pkgJsonFile);
  deps[pkgJson.name] = pkgJson.version;
}
