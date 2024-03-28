const path = require("node:path");
const babel = require("@rollup/plugin-babel").default;
const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const copy = require("rollup-plugin-copy");

const {
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
    "remix-serve"
  );

  return [
    {
      external() {
        return true;
      },
      input: `${SOURCE_DIR}/cli.ts`,
      output: {
        banner: createBanner(name, version, { executable: true }),
        dir: OUTPUT_DIR,
        format: "cjs",
      },
      plugins: [
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          extensions: [".ts"],
          ...remixBabelConfig,
        }),
        typescript({
          tsconfig: path.join(__dirname, "tsconfig.json"),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        nodeResolve({ extensions: [".ts"] }),
        copy({
          targets: [
            { src: path.join(ROOT_DIR, "LICENSE.md"), dest: SOURCE_DIR },
          ],
        }),
        {
          name: "dynamic-import-polyfill",
          renderDynamicImport() {
            return {
              left: "import(",
              right: ")",
            };
          },
        },
      ],
    },
  ];
};
