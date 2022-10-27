const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const extensions = require("rollup-plugin-extensions");
const prettier = require("rollup-plugin-prettier");
const replace = require("@rollup/plugin-replace");
const { terser } = require("rollup-plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const {
  createBanner,
  getBuildDirectories,
  PRETTY,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

module.exports = function rollup() {
  const { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(name);

  // JS modules for bundlers
  const modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: ["@remix-run/router", "react"],
      plugins: [
        extensions({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        copy({
          targets: [
            { src: path.join(ROOT_DIR, "LICENSE.md"), dest: SOURCE_DIR },
          ],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // JS modules for <script type=module>
  const webModules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/react-router.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: ["@remix-run/router", "react"],
      plugins: [
        extensions({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            "@babel/preset-modules",
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        typescript({
          tsconfig: path.join(__dirname, "tsconfig.json"),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/react-router.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: ["@remix-run/router", "react"],
      plugins: [
        extensions({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            [
              "@babel/preset-modules",
              {
                // Don't spoof `.name` for Arrow Functions, which breaks when minified anyway.
                loose: true,
              },
            ],
            [
              "@babel/preset-react",
              {
                // Compile JSX Spread to Object.assign(), which is reliable in ESM browsers.
                useBuiltIns: true,
              },
            ],
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") },
        }),
        // compiler(),
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // UMD modules for <script> tags and CommonJS (node)
  const globals = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: {
          "@remix-run/router": "RemixRouter",
          react: "React",
        },
        name: "ReactRouter",
      },
      external: ["@remix-run/router", "react"],
      plugins: [
        extensions({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: {
          "@remix-run/router": "RemixRouter",
          react: "React",
        },
        name: "ReactRouter",
      },
      external: ["@remix-run/router", "react"],
      plugins: [
        extensions({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") },
        }),
        // compiler(),
        terser(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // Node entry points
  const node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: "cjs",
        banner: createBanner("React Router", version),
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals, ...node];
};

/**
 * @typedef {import('rollup').InputOptions} RollupInputOptions
 * @typedef {import('rollup').OutputOptions} RollupOutputOptions
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('rollup').Plugin} RollupPlugin
 */
