const fs = require("fs");
const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const copy = require("rollup-plugin-copy");
const fse = require("fs-extra");

const PRETTY = !!process.env.PRETTY;
const executableBanner = "#!/usr/bin/env node\n";
const defaultBuildDir = "build";
const buildDir = getBuildDir();

function getBuildDir() {
  if (!process.env.LOCAL_BUILD_DIRECTORY) {
    return path.relative(process.cwd(), path.join(__dirname, defaultBuildDir));
  }

  let appDir = path.join(process.cwd(), process.env.LOCAL_BUILD_DIRECTORY);
  try {
    fse.readdirSync(path.join(appDir, "node_modules"));
    console.log("Writing rollup output to", appDir);
    return appDir;
  } catch (e) {
    console.error(
      "Oops! You pointed LOCAL_BUILD_DIRECTORY to a directory that " +
        "does not have a node_modules/ folder. Please `npm install` in that " +
        "directory and try again."
    );
    process.exit(1);
  }
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

function getVersion(packageDir) {
  return require(`./${packageDir}/package.json`).version;
}

function isBareModuleId(id) {
  return !id.startsWith(".") && !path.isAbsolute(id);
}

/** @returns {import("rollup").RollupOptions[]} */
function getAdapterConfig(adapterName) {
  let packageName = `@remix-run/${adapterName}`;
  let sourceDir =
    path.relative(
      process.cwd(),
      path.join(__dirname, "packages", `remix-${adapterName}`)
    ) || ".";
  let outputDir = path.join(buildDir, `node_modules/${packageName}`);
  let version = getVersion(sourceDir);

  let hasMagicExports = fse.existsSync(`${sourceDir}/magicExports/remix.ts`);

  return [
    {
      external(id) {
        return isBareModuleId(id);
      },
      input: `${sourceDir}/index.ts`,
      output: {
        banner: createBanner(packageName, version),
        dir: outputDir,
        format: "cjs",
        preserveModules: true,
        exports: "auto",
      },
      plugins: [
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts", ".tsx"],
          rootMode: "upward",
        }),
        nodeResolve({ extensions: [".ts", ".tsx"] }),
        copy({
          targets: [
            { src: `LICENSE.md`, dest: outputDir },
            { src: `${sourceDir}/package.json`, dest: outputDir },
            { src: `${sourceDir}/README.md`, dest: outputDir },
          ],
        }),
        copyToPlaygrounds(),
      ],
    },
    ...(hasMagicExports
      ? [
          {
            external() {
              return true;
            },
            input: `${sourceDir}/magicExports/remix.ts`,
            output: {
              banner: createBanner(packageName, version),
              dir: `${outputDir}/magicExports`,
              format: "cjs",
            },
            plugins: [
              babel({
                babelHelpers: "bundled",
                exclude: /node_modules/,
                extensions: [".ts", ".tsx"],
                rootMode: "upward",
              }),
              copyToPlaygrounds(),
            ],
          },
          {
            external() {
              return true;
            },
            input: `${sourceDir}/magicExports/remix.ts`,
            output: {
              banner: createBanner(packageName, version),
              dir: `${outputDir}/magicExports/esm`,
              format: "esm",
            },
            plugins: [
              babel({
                babelHelpers: "bundled",
                exclude: /node_modules/,
                extensions: [".ts", ".tsx"],
                rootMode: "upward",
              }),
              copyToPlaygrounds(),
            ],
          },
        ]
      : []),
  ];
}

async function triggerLiveReload(appDir) {
  // Tickle live reload by touching the server entry
  // Consider all of entry.server.{tsx,ts,jsx,js} since React may be used
  // via `React.createElement` without the need for JSX.
  let serverEntryPaths = [
    "entry.server.ts",
    "entry.server.tsx",
    "entry.server.js",
    "entry.server.jsx",
  ];
  let serverEntryPath = serverEntryPaths
    .map((entryFile) => path.join(appDir, "app", entryFile))
    .find((entryPath) => fse.existsSync(entryPath));
  if (serverEntryPath) {
    let date = new Date();
    await fs.promises.utimes(serverEntryPath, date, date);
  }
}

function copyToPlaygrounds() {
  return {
    name: "copy-to-remix-playground",
    async writeBundle(options, bundle) {
      // Write to playgrounds for normal builds not using LOCAL_BUILD_DIRECTORY
      if (!process.env.LOCAL_BUILD_DIRECTORY) {
        let playgroundsDir = path.join(__dirname, "playground");
        let playgrounds = await fs.promises.readdir(playgroundsDir);
        let writtenDir = path.join(process.cwd(), options.dir);
        for (let playground of playgrounds) {
          let playgroundDir = path.join(playgroundsDir, playground);
          if (!fse.statSync(playgroundDir).isDirectory()) {
            continue;
          }
          let destDir = writtenDir.replace(
            path.join(__dirname, "build"),
            playgroundDir
          );
          await fse.copy(writtenDir, destDir);
          await triggerLiveReload(playgroundDir);
        }
      } else {
        // Otherwise, trigger live reload on our LOCAL_BUILD_DIRECTORY folder
        await triggerLiveReload(buildDir);
      }
    },
  };
}

module.exports = {
  buildDir,
  copyToPlaygrounds,
  createBanner,
  defaultBuildDir,
  executableBanner,
  getAdapterConfig,
  getVersion,
  isBareModuleId,
  PRETTY,
};
