const path = require("path");

const babel = require("@rollup/plugin-babel").default;
const typescript = require("@rollup/plugin-typescript");
const copy = require("rollup-plugin-copy");
const extensions = require("rollup-plugin-extensions");
const prettier = require("rollup-plugin-prettier");

const {
  createBanner,
  getBuildDirectories,
  PRETTY,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

function getRollupConfig(
  format,
  inputFilename,
  outputFilename,
  { includeTypesAndCopy, executable } = {}
) {
  const { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    // We don't live in a folder matching our package name
    "dev"
  );

  return {
    input: `${SOURCE_DIR}/${inputFilename}`,
    output: {
      file: `${OUTPUT_DIR}/${outputFilename}`,
      format,
      sourcemap: !PRETTY,
      banner: createBanner("@react-router/dev", version, { executable }),
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
      ...(includeTypesAndCopy === true
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
    getRollupConfig("cjs", "index.ts", "index.js", {
      includeTypesAndCopy: true,
    }),
    getRollupConfig("cjs", "cli.ts", "cli.js", { executable: true }),
  ];
};

/**
 * @typedef {import('rollup').InputOptions} RollupInputOptions
 * @typedef {import('rollup').OutputOptions} RollupOutputOptions
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('rollup').Plugin} RollupPlugin
 */
