/* eslint-disable import/no-nodejs-modules */
const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const prettier = require("rollup-plugin-prettier");
const replace = require("@rollup/plugin-replace");
const { terser } = require("rollup-plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const {
  babelPluginReplaceVersionPlaceholder,
  createBanner,
  isBareModuleId,
  getBuildDirectories,
  validateReplacedVersion,
  PRETTY,
  WATCH,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

module.exports = function rollup() {
  const { SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(name);

  // JS modules for bundlers
  const modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.mjs`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        typescript({
          // eslint-disable-next-line no-restricted-globals
          tsconfig: path.join(__dirname, "tsconfig.json"),
          exclude: ["__tests__"],
          noEmitOnError: !WATCH,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
          verbose: true,
        }),
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/dom-export.tsx`,
      output: {
        file: `${OUTPUT_DIR}/dom-export.mjs`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        typescript({
          // eslint-disable-next-line no-restricted-globals
          tsconfig: path.join(__dirname, "tsconfig.dom.json"),
          noEmitOnError: !WATCH,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/lib/types.ts`,
      output: {
        file: `${OUTPUT_DIR}/lib/types.mjs`,
        format: "esm",
        banner: createBanner("React Router", version),
      },
      external: isBareModuleId,
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        typescript({
          // eslint-disable-next-line no-restricted-globals
          tsconfig: path.join(__dirname, "tsconfig.dom.json"),
          noEmitOnError: !WATCH,
        }),
      ],
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
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            "@babel/preset-modules",
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
        validateReplacedVersion(),
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
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
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
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") },
        }),
        validateReplacedVersion(),
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/dom-export.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router-dom.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            "@babel/preset-modules",
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/dom-export.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router-dom.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
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
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") },
        }),
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
          react: "React",
        },
        name: "ReactRouter",
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
        validateReplacedVersion(),
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
          react: "React",
        },
        name: "ReactRouter",
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") },
        }),
        terser(),
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/dom-export.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router-dom.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: {
          react: "React",
          "react-router": "ReactRouter",
        },
        name: "ReactRouterDOMExport",
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/dom-export.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router-dom.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: {
          react: "React",
          "react-router": "ReactRouter",
        },
        name: "ReactRouterDomExport",
      },
      external: (id) => isBareModuleId(id),
      plugins: [
        nodeResolve({ extensions: [".tsx", ".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") },
        }),
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
    {
      input: `${SOURCE_DIR}/node-main-dom-export.js`,
      output: {
        file: `${OUTPUT_DIR}/main-dom-export.js`,
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
