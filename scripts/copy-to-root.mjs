import * as path from "path";
import * as fs from "fs";
import * as fse from "fs-extra";
import { createRequire } from "node:module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const packages = [
  "react-router",
  "react-router-dom",
  "react-router-native",
  "react-router-dom-v5-compat",
  "router",
];

(async () => await Promise.all(packages.map(copy)))().then(() =>
  console.log("Copy complete")
);

async function copy(packageName) {
  /** @type {import('type-fest').PackageJson} */
  let packageJson = require(`../packages/${packageName}/package.json`);
  let srcPath = path.join(ROOT_DIR, "packages", packageName);
  let destPath = path.join(ROOT_DIR, `build/node_modules/${packageJson.name}`);
  await ensureDir(destPath);
  await Promise.all([
    fse.copy(
      path.join(srcPath, "package.json"),
      path.join(destPath, "package.json")
    ),
    packageJson.files.map((file) => {
      return fse.copy(path.join(srcPath, file), path.join(destPath, file));
    }),
  ]);
}

async function ensureDir(dir) {
  if ((await fse.pathExists(dir)) ? !fs.statSync(dir).isDirectory() : true) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}
