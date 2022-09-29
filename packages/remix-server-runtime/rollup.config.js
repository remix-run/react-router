/* eslint-disable no-restricted-globals, import/no-nodejs-modules */
const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const copy = require("rollup-plugin-copy");
const replace = require("@rollup/plugin-replace");

const {
  getOutputDir,
  isBareModuleId,
  createBanner,
  copyToPlaygrounds,
  magicExportsPlugin,
} = require("../../rollup.utils");
const { name: packageName, version } = require("./package.json");

const ENABLE_REMIX_ROUTER = !!process.env.ENABLE_REMIX_ROUTER;

const replacePlugin = replace({
  preventAssignment: true,
  values: {
    "process.env.ENABLE_REMIX_ROUTER": ENABLE_REMIX_ROUTER ? "1" : "0",
  },
});

/** @returns {import("rollup").RollupOptions[]} */
module.exports = function rollup() {
  let sourceDir = "packages/remix-server-runtime";
  let outputDir = getOutputDir(packageName);
  let outputDist = path.join(outputDir, "dist");

  return [
    {
      external(id) {
        return isBareModuleId(id);
      },
      input: `${sourceDir}/index.ts`,
      output: {
        banner: createBanner(packageName, version),
        dir: outputDist,
        format: "cjs",
        preserveModules: true,
        exports: "named",
      },
      treeshake: {
        // Without this, we don't tree-shake the require('@remix-run/router') :/
        moduleSideEffects: false,
      },
      plugins: [
        replacePlugin,
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts", ".tsx"],
        }),
        nodeResolve({ extensions: [".ts", ".tsx"] }),
        copy({
          targets: [
            { src: "LICENSE.md", dest: [outputDir, sourceDir] },
            { src: `${sourceDir}/package.json`, dest: outputDir },
            { src: `${sourceDir}/README.md`, dest: outputDir },
          ],
        }),
        magicExportsPlugin({ packageName, version }),
        copyToPlaygrounds(),
      ],
    },
    {
      external(id) {
        return isBareModuleId(id);
      },
      input: `${sourceDir}/index.ts`,
      output: {
        banner: createBanner(packageName, version),
        dir: `${outputDist}/esm`,
        format: "esm",
        preserveModules: true,
      },
      treeshake: {
        // Without this, we don't tree-shake the require('@remix-run/router') :/
        moduleSideEffects: false,
      },
      plugins: [
        replacePlugin,
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts", ".tsx"],
        }),
        nodeResolve({ extensions: [".ts", ".tsx"] }),
        copyToPlaygrounds(),
      ],
    },
  ];
};
