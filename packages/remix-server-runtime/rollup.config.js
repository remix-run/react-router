/* eslint-disable import/no-nodejs-modules */
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
  const { SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    // We don't live in a folder matching our package name
    "remix-server-runtime"
  );

  return [
    {
      external: (id) => isBareModuleId(id),
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        banner: createBanner(name, version),
        dir: OUTPUT_DIR,
        format: "cjs",
        preserveModules: true,
        exports: "named",
      },
      plugins: [
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts", ".tsx"],
          ...remixBabelConfig,
        }),
        nodeResolve({ extensions: [".ts", ".tsx"] }),
        typescript({
          // eslint-disable-next-line no-restricted-globals
          tsconfig: path.join(__dirname, "tsconfig.json"),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
        }),
      ],
    },
    {
      external: (id) => isBareModuleId(id),
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        banner: createBanner(name, version),
        dir: `${OUTPUT_DIR}/esm`,
        format: "esm",
        preserveModules: true,
      },
      plugins: [
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts", ".tsx"],
          ...remixBabelConfig,
        }),
        nodeResolve({ extensions: [".ts", ".tsx"] }),
      ],
    },
  ];
};
