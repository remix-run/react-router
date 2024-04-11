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
    "remix-node"
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
        typescript({
          tsconfig: path.join(__dirname, "tsconfig.json"),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        nodeResolve({ extensions: [".ts", ".tsx"] }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
        }),
      ],
    },
  ];
};
