import * as path from "path";
import { default as babel } from "@rollup/plugin-babel";
import copy from "rollup-plugin-copy";
import extensions from "rollup-plugin-extensions";
import prettier from "rollup-plugin-prettier";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const PRETTY = !!process.env.PRETTY;
const PACKAGE_DIR = path.join(__dirname, "packages");

function createBanner(libraryName, version) {
  return `/**
 * ${libraryName} v${version}
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */`;
}

function getVersion(sourceDir) {
  return require(`./${sourceDir}/package.json`).version;
}

/**
 * @returns {RollupOptions[]}
 */
function router() {
  const PACKAGE_NAME = "router";
  const SOURCE_DIR = `packages/${PACKAGE_NAME}`;
  const OUTPUT_DIR = `${SOURCE_DIR}/dist`;
  let version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  /** @type {RollupOptions[]} */
  let modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
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
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts"],
        }),
        typescript({
          tsconfig: path.join(PACKAGE_DIR, PACKAGE_NAME, "tsconfig.json"),
          outDir: path.join(PACKAGE_DIR, PACKAGE_NAME),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // JS modules for <script type=module>
  /** @type {RollupOptions[]} */
  let webModules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/${PACKAGE_NAME}.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("@remix-run/router", version),
      },
      plugins: [
        extensions({ extensions: [".ts"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: ["@babel/preset-modules", "@babel/preset-typescript"],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts"],
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
        file: `${OUTPUT_DIR}/${PACKAGE_NAME}.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("@remix-run/router", version),
      },
      plugins: [
        extensions({ extensions: [".ts"] }),
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
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts"],
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
  /** @type {RollupOptions[]} */
  let globals = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("@remix-run/router", version),
        name: "Router",
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
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts"],
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
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("@remix-run/router", version),
        name: "Router",
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
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts"],
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
  /** @type {RollupOptions[]} */
  let node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: "cjs",
        banner: createBanner("@remix-run/router", version),
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals, ...node];
}

/**
 * @returns {RollupOptions[]}
 */
function reactRouter() {
  const PACKAGE_NAME = "react-router";
  const SOURCE_DIR = `packages/${PACKAGE_NAME}`;
  const OUTPUT_DIR = `${SOURCE_DIR}/dist`;

  let version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  /** @type {RollupOptions[]} */
  let modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: ["history", "@remix-run/router", "react"],
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
        typescript({
          tsconfig: path.join(PACKAGE_DIR, PACKAGE_NAME, "tsconfig.json"),
          outDir: path.join(PACKAGE_DIR, PACKAGE_NAME),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // JS modules for <script type=module>
  /** @type {RollupOptions[]} */
  let webModules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/${PACKAGE_NAME}.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: ["history", "@remix-run/router", "react"],
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
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/${PACKAGE_NAME}.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
      },
      external: ["history", "@remix-run/router", "react"],
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
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // UMD modules for <script> tags and CommonJS (node)
  /** @type {RollupOptions[]} */
  let globals = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: {
          history: "HistoryLibrary",
          "@remix-run/router": "Router",
          react: "React",
        },
        name: "ReactRouter",
      },
      external: ["history", "@remix-run/router", "react"],
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
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: {
          history: "HistoryLibrary",
          "@remix-run/router": "Router",
          react: "React",
        },
        name: "ReactRouter",
      },
      external: ["history", "@remix-run/router", "react"],
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
        terser(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // Node entry points
  /** @type {RollupOptions[]} */
  let node = [
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
}

/**
 * @returns {RollupOptions[]}
 */
function reactRouterDom() {
  const PACKAGE_NAME = "react-router-dom";
  const SOURCE_DIR = `packages/${PACKAGE_NAME}`;
  const OUTPUT_DIR = `${SOURCE_DIR}/dist`;
  let version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  let modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
      },
      external: [
        "history",
        "react",
        "react-dom",
        "react-router",
        "@remix-run/router",
      ],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
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
        typescript({
          tsconfig: path.join(PACKAGE_DIR, PACKAGE_NAME, "tsconfig.json"),
          outDir: path.join(PACKAGE_DIR, PACKAGE_NAME),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // JS modules for <script type=module>
  // Note: These are experimental. You may not even get them to work
  // unless you are using a React build with JS modules like es-react.
  let webModules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/${PACKAGE_NAME}.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
      },
      external: ["history", "react", "react-router", "@remix-run/router"],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
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
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") },
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/${PACKAGE_NAME}.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
      },
      external: ["history", "react", "react-router", "@remix-run/router"],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
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
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // UMD modules for <script> tags and CommonJS (node)
  let globals = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
        globals: {
          history: "HistoryLibrary",
          "@remix-run/router": "Router",
          react: "React",
          "react-router": "ReactRouter",
        },
        name: "ReactRouterDOM",
      },
      external: ["history", "react", "react-router", "@remix-run/router"],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
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
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
        globals: {
          history: "HistoryLibrary",
          "@remix-run/router": "Router",
          react: "React",
          "react-router": "ReactRouter",
        },
        name: "ReactRouterDOM",
      },
      external: ["history", "react", "react-router", "@remix-run/router"],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
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
        terser(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // Node entry points
  let node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: "cjs",
        banner: createBanner("React Router DOM", version),
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/server.tsx`,
      output: [
        {
          // the server file needs to go in the package root directory
          // TODO: Change this in v7
          file: `${SOURCE_DIR}/server.js`,
          format: "cjs",
        },
        {
          file: `${OUTPUT_DIR}/server.js`,
          format: "cjs",
        },
      ],
      external: [
        "url",
        "history",
        "react",
        "react-dom/server",
        "react-router-dom",
        "@remix-run/router",
      ],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
        babel({
          babelHelpers: "bundled",
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true, targets: { node: true } }],
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/server.tsx`,
      output: [
        {
          // the server file needs to go in the package root directory
          // TODO: Change this in v7
          file: `${SOURCE_DIR}/server.mjs`,
          format: "esm",
        },
        {
          file: `${OUTPUT_DIR}/server.mjs`,
          format: "esm",
        },
      ],
      external: [
        "url",
        "history",
        "react",
        "react-dom/server",
        "react-router-dom",
        "@remix-run/router",
      ],
      plugins: [
        extensions({ extensions: [".ts", ".tsx"] }),
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
            "@babel/preset-react",
            "@babel/preset-typescript",
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"],
        }),
        typescript({
          tsconfig: path.join(PACKAGE_DIR, PACKAGE_NAME, "tsconfig.json"),
          outDir: path.join(PACKAGE_DIR, PACKAGE_NAME),
          include: ["server.tsx"],
          noEmitOnError: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals, ...node];
}

/**
 * @returns {RollupOptions[]}
 */
function reactRouterDomV5Compat() {
  const PACKAGE_NAME = "react-router-dom-v5-compat";
  const SOURCE_DIR = `packages/${PACKAGE_NAME}`;
  const OUTPUT_DIR = `${SOURCE_DIR}/dist`;

  let version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  let modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM v5 Compat", version),
      },
      external: [
        "history",
        "@remix-run/router",
        "react",
        "react-dom",
        "react-router",
        "react-router-dom",
      ],
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
        typescript({
          tsconfig: path.join(PACKAGE_DIR, PACKAGE_NAME, "tsconfig.json"),
          outDir: path.join(PACKAGE_DIR, PACKAGE_NAME),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // UMD modules for <script> tags and CommonJS (node)
  let globals = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM v5 Compat", version),
        globals: {
          history: "HistoryLibrary",
          "@remix-run/router": "Router",
          react: "React",
          "react-router": "ReactRouter",
          "react-router-dom": "ReactRouterDOM",
        },
        name: "ReactRouterDOMv5Compat",
      },
      external: [
        "history",
        "@remix-run/router",
        "react",
        "react-router",
        "react-router-dom",
      ],
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
        file: `${OUTPUT_DIR}/umd/${PACKAGE_NAME}.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM v5 Compat", version),
        globals: {
          history: "HistoryLibrary",
          "@remix-run/router": "Router",
          react: "React",
          "react-router": "ReactRouter",
          "react-router-dom": "ReactRouterDOM",
        },
        name: "ReactRouterDOMv5Compat",
      },
      external: [
        "history",
        "@remix-run/router",
        "react",
        "react-router",
        "react-router-dom",
      ],
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
        terser(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  // Node entry points
  let node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: "cjs",
        banner: createBanner("React Router DOM v5 Compat", version),
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return [...modules, ...globals, ...node];
}

/**
 * @returns {RollupOptions[]}
 */
function reactRouterNative() {
  const PACKAGE_NAME = "react-router-native";
  const SOURCE_DIR = `packages/${PACKAGE_NAME}`;
  const OUTPUT_DIR = `${SOURCE_DIR}/dist`;

  let version = getVersion(SOURCE_DIR);

  let modules = [
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
        typescript({
          tsconfig: path.join(PACKAGE_DIR, PACKAGE_NAME, "tsconfig.json"),
          outDir: path.join(PACKAGE_DIR, PACKAGE_NAME),
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: "LICENSE.md", dest: SOURCE_DIR }],
          verbose: true,
        }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return modules;
}

/**
 * @param {RollupInputOptions[]} options
 * @return {RollupOptions[]}
 */
export default function rollup(options) {
  let builds = [
    ...router(options),
    ...reactRouter(options),
    ...reactRouterDom(options),
    ...reactRouterNative(options),
    ...reactRouterDomV5Compat(options),
  ];
  return builds;
}

/**
 * @typedef {import('rollup').InputOptions} RollupInputOptions
 * @typedef {import('rollup').OutputOptions} RollupOutputOptions
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('rollup').Plugin} RollupPlugin
 */
