const path = require("path");
const fse = require("fs-extra");

const PRETTY = !!process.env.PRETTY;

/**
 * Determine the relevant directories for a rollup build, relative to the
 * current working directory and taking LOCAL_BUILD_DIRECTORY into account
 *
 * ROOT_DIR     Root directory for the react-router repo
 * SOURCE_DIR   Source package directory we will read input files from
 * OUTPUT_DIR   Destination directory to write rollup output to
 *
 * @param {string} packageName  npm package name (i.e., @remix-run/router)
 * @param {string} [folderName] folder name (i.e., router). Defaults to package name
 */
function getBuildDirectories(packageName, folderName) {
  let ROOT_DIR = __dirname;
  let SOURCE_DIR = folderName
    ? path.join(__dirname, "packages", folderName)
    : path.join(__dirname, "packages", ...packageName.split("/"));

  // Update if we're not running from root
  if (process.cwd() !== __dirname) {
    ROOT_DIR = path.dirname(path.dirname(process.cwd()));
    SOURCE_DIR = process.cwd();
  }

  let OUTPUT_DIR = path.join(SOURCE_DIR, "dist");

  if (process.env.LOCAL_BUILD_DIRECTORY) {
    try {
      let nodeModulesDir = path.resolve(
        process.env.LOCAL_BUILD_DIRECTORY,
        "node_modules"
      );
      fse.readdirSync(nodeModulesDir);
      OUTPUT_DIR = path.join(nodeModulesDir, ...packageName.split("/"), "dist");
    } catch (e) {
      console.error(
        "Oops! You pointed LOCAL_BUILD_DIRECTORY to a directory that " +
          "does not have a node_modules/ folder. Please `npm install` in that " +
          "directory and try again."
      );
      process.exit(1);
    }
  }

  return { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR };
}

function createBanner(packageName, version) {
  return `/**
 * ${packageName} v${version}
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */`;
}

module.exports = {
  getBuildDirectories,
  createBanner,
  PRETTY,
};
