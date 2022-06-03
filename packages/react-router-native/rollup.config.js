const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const prettier = require("rollup-plugin-prettier");
const {
  buildDir,
  createBanner,
  getVersion,
  PRETTY,
} = require("../../rollup.utils");

module.exports = function rollup() {
  const SOURCE_DIR = path.relative(process.cwd(), __dirname) || ".";
  const OUTPUT_DIR = path.join(buildDir, "node_modules/react-router-native");
  const version = getVersion(SOURCE_DIR);

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
            { src: `${SOURCE_DIR}/package.json`, dest: OUTPUT_DIR },
            { src: `${SOURCE_DIR}/README.md`, dest: OUTPUT_DIR },
            { src: "LICENSE.md", dest: OUTPUT_DIR },
          ],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return modules;
};
