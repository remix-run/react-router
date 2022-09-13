const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const extensions = require("rollup-plugin-extensions");
const prettier = require("rollup-plugin-prettier");
const typescript = require("@rollup/plugin-typescript");
const {
  createBanner,
  getBuildDirectories,
  PRETTY,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

function getRollupConfig(format, filename, includeTypesAndCopy = false) {
  const { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    // We don't live in a folder matching our package name
    "router"
  );

  return {
    input: `${SOURCE_DIR}/index.ts`,
    output: {
      file: `${OUTPUT_DIR}/${filename}`,
      format,
      sourcemap: !PRETTY,
      banner: createBanner("@remix-run/router", version),
    },
    plugins: [
      extensions({ extensions: [".ts"] }),
      babel({
        babelHelpers: "bundled",
        exclude: /node_modules/,
        presets: [
          ["@babel/preset-env", { loose: true }],
          "@babel/preset-typescript",
        ],
        extensions: [".ts"],
      }),
      ...(includeTypesAndCopy
        ? [
            typescript({
              tsconfig: path.join(__dirname, "tsconfig.json"),
              exclude: ["__tests__"],
              noEmitOnError: true,
            }),
            copy({
              targets: [
                { src: path.join(ROOT_DIR, "LICENSE.md"), dest: SOURCE_DIR },
              ],
              verbose: true,
            }),
          ]
        : []),
    ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
  };
}

module.exports = function rollup() {
  return [
    getRollupConfig("esm", "router.js", true),
    getRollupConfig("cjs", "router.cjs.js", false),
  ];
};

/**
 * @typedef {import('rollup').InputOptions} RollupInputOptions
 * @typedef {import('rollup').OutputOptions} RollupOutputOptions
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('rollup').Plugin} RollupPlugin
 */
