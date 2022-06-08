const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const prettier = require("rollup-plugin-prettier");
const {
  createBanner,
  getBuildDirectories,
  PRETTY,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

module.exports = function rollup() {
  const { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(name);

  const modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router Native", version),
      },
      external: [
        "@babel/runtime/helpers/esm/extends",
        "@babel/runtime/helpers/esm/objectWithoutPropertiesLoose",
        "@ungap/url-search-params",
        "history",
        "react",
        "react-native",
        "react-router",
        "@remix-run/router",
      ],
      plugins: [
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            [
              "module:metro-react-native-babel-preset",
              {
                disableImportExportTransform: true,
                enableBabelRuntime: false,
              },
            ],
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        copy({
          targets: [
            { src: path.join(SOURCE_DIR, "package.json"), dest: OUTPUT_DIR },
            { src: path.join(SOURCE_DIR, "README.md"), dest: OUTPUT_DIR },
            { src: path.join(ROOT_DIR, "LICENSE.md"), dest: OUTPUT_DIR },
          ],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return modules;
};
