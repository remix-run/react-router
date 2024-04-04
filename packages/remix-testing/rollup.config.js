const path = require("node:path");
const babel = require("@rollup/plugin-babel").default;
const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const copy = require("rollup-plugin-copy");

const {
  isBareModuleId,
  createBanner,
  getBuildDirectories,
  remixBabelConfig,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

/** @returns {import("rollup").RollupOptions[]} */
module.exports = function rollup() {
  const { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    // We don't live in a folder matching our package name
    "remix-testing"
  );

  let sharedPlugins = [
    babel({
      babelHelpers: "bundled",
      exclude: /node_modules/,
      extensions: [".ts", ".tsx"],
      ...remixBabelConfig,
    }),
    nodeResolve({ extensions: [".ts", ".tsx"] }),
  ];

  /** @type {import("rollup").RollupOptions} */
  let remixTestingCJS = {
    external: (id) => isBareModuleId(id),
    input: path.join(SOURCE_DIR, "index.ts"),
    output: {
      banner: createBanner(name, version),
      dir: OUTPUT_DIR,
      format: "cjs",
      preserveModules: true,
      exports: "auto",
    },
    plugins: [
      ...sharedPlugins,
      typescript({
        tsconfig: path.join(__dirname, "tsconfig.json"),
        exclude: ["__tests__"],
        noEmitOnError: true,
      }),
      copy({
        targets: [{ src: path.join(ROOT_DIR, "LICENSE.md"), dest: SOURCE_DIR }],
      }),
    ],
  };

  // The browser build of remix-testing is ESM so we can treeshake it.
  /** @type {import("rollup").RollupOptions} */
  let remixTestingESM = {
    external: (id) => isBareModuleId(id),
    input: path.join(SOURCE_DIR, "index.ts"),
    output: {
      banner: createBanner(name, version),
      dir: path.join(OUTPUT_DIR, "esm"),
      format: "esm",
      preserveModules: true,
    },
    plugins: [...sharedPlugins],
  };

  return [remixTestingCJS, remixTestingESM];
};
