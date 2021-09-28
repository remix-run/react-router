import * as fs from "fs";
import babel from "rollup-plugin-babel";
// import compiler from "@ampproject/rollup-plugin-closure-compiler";
import copy from "rollup-plugin-copy";
import prettier from "rollup-plugin-prettier";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";

const PRETTY = !!process.env.PRETTY;

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

function reactRouter() {
  const SOURCE_DIR = "packages/react-router";
  const OUTPUT_DIR = "build/node_modules/react-router";
  const version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  const modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version)
      },
      external: ["history", "react"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        copy({
          targets: [
            { src: `${SOURCE_DIR}/package.json`, dest: OUTPUT_DIR },
            { src: `${SOURCE_DIR}/README.md`, dest: OUTPUT_DIR },
            { src: "LICENSE.md", dest: OUTPUT_DIR }
          ],
          verbose: true
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  // JS modules for <script type=module>
  const webModules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version)
      },
      external: ["history", "react"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            "@babel/preset-modules",
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") }
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version)
      },
      external: ["history", "react"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            [
              "@babel/preset-modules",
              {
                // Don't spoof `.name` for Arrow Functions, which breaks when minified anyway.
                loose: true
              }
            ],
            [
              "@babel/preset-react",
              {
                // Compile JSX Spread to Object.assign(), which is reliable in ESM browsers.
                useBuiltIns: true
              }
            ],
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") }
        }),
        // compiler(),
        terser({ ecma: 8, safari10: true })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  // UMD modules for <script> tags and CommonJS (node)
  const globals = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: { history: "HistoryLibrary", react: "React" },
        name: "ReactRouter"
      },
      external: ["history", "react"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") }
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router", version),
        globals: { history: "HistoryLibrary", react: "React" },
        name: "ReactRouter"
      },
      external: ["history", "react"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") }
        }),
        // compiler(),
        terser()
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  // Node entry points
  const node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: "cjs",
        banner: createBanner("React Router", version)
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  return [...modules, ...webModules, ...globals, ...node];
}

function reactRouterDom() {
  const SOURCE_DIR = "packages/react-router-dom";
  const OUTPUT_DIR = "build/node_modules/react-router-dom";
  const version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  const modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version)
      },
      external: ["history", "react", "react-dom", "react-router"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        copy({
          targets: [
            { src: `${SOURCE_DIR}/package.json`, dest: OUTPUT_DIR },
            { src: `${SOURCE_DIR}/README.md`, dest: OUTPUT_DIR },
            { src: "LICENSE.md", dest: OUTPUT_DIR }
          ],
          verbose: true
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  // JS modules for <script type=module>
  // Note: These are experimental. You may not even get them to work
  // unless you are using a React build with JS modules like es-react.
  const webModules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router-dom.development.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version)
      },
      external: ["history", "react", "react-router"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            "@babel/preset-modules",
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") }
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router-dom.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version)
      },
      external: ["history", "react", "react-router"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            [
              "@babel/preset-modules",
              {
                // Don't spoof `.name` for Arrow Functions, which breaks when minified anyway.
                loose: true
              }
            ],
            [
              "@babel/preset-react",
              {
                // Compile JSX Spread to Object.assign(), which is reliable in ESM browsers.
                useBuiltIns: true
              }
            ],
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") }
        }),
        // compiler(),
        terser({ ecma: 8, safari10: true })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  // UMD modules for <script> tags and CommonJS (node)
  const globals = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router-dom.development.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
        globals: {
          history: "HistoryLibrary",
          react: "React",
          "react-router": "ReactRouter"
        },
        name: "ReactRouterDOM"
      },
      external: ["history", "react", "react-router"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("development") }
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router-dom.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
        globals: {
          history: "HistoryLibrary",
          react: "React",
          "react-router": "ReactRouter"
        },
        name: "ReactRouterDOM"
      },
      external: ["history", "react", "react-router"],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        replace({
          preventAssignment: true,
          values: { "process.env.NODE_ENV": JSON.stringify("production") }
        }),
        // compiler(),
        terser()
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  // Node entry points
  const node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: "cjs",
        banner: createBanner("React Router DOM", version)
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    },
    {
      input: `${SOURCE_DIR}/server.tsx`,
      output: {
        file: `${OUTPUT_DIR}/server.js`,
        format: "cjs"
      },
      external: [
        "url",
        "history",
        "react",
        "react-dom/server",
        "react-router-dom"
      ],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            ["@babel/preset-env", { loose: true, targets: { node: true } }],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        })
        // compiler()
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    },
    {
      input: `${SOURCE_DIR}/server.tsx`,
      output: {
        file: `${OUTPUT_DIR}/server.mjs`,
        format: "esm"
      },
      external: [
        "url",
        "history",
        "react",
        "react-dom/server",
        "react-router-dom"
      ],
      plugins: [
        babel({
          exclude: /node_modules/,
          presets: [
            [
              "@babel/preset-modules",
              {
                // Don't spoof `.name` for Arrow Functions, which breaks when minified anyway.
                loose: true
              }
            ],
            "@babel/preset-react",
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        })
        // compiler()
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  return [...modules, ...webModules, ...globals, ...node];
}

function reactRouterNative() {
  const SOURCE_DIR = "packages/react-router-native";
  const OUTPUT_DIR = "build/node_modules/react-router-native";
  const version = getVersion(SOURCE_DIR);

  const modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router Native", version)
      },
      external: [
        "@babel/runtime/helpers/esm/extends",
        "@babel/runtime/helpers/esm/objectWithoutPropertiesLoose",
        "@ungap/url-search-params",
        "history",
        "react",
        "react-native",
        "react-router"
      ],
      plugins: [
        babel({
          exclude: /node_modules/,
          runtimeHelpers: true,
          presets: [
            [
              "module:metro-react-native-babel-preset",
              {
                disableImportExportTransform: true,
                enableBabelRuntime: false
              }
            ],
            "@babel/preset-typescript"
          ],
          plugins: ["babel-plugin-dev-expression"],
          extensions: [".ts", ".tsx"]
        }),
        copy({
          targets: [
            { src: `${SOURCE_DIR}/package.json`, dest: OUTPUT_DIR },
            { src: `${SOURCE_DIR}/README.md`, dest: OUTPUT_DIR },
            { src: "LICENSE.md", dest: OUTPUT_DIR }
          ],
          verbose: true
        })
      ].concat(PRETTY ? prettier({ parser: "babel" }) : [])
    }
  ];

  return modules;
}

export default function rollup(options) {
  let builds = [
    ...reactRouter(options),
    ...reactRouterDom(options),
    ...reactRouterNative(options)
  ];

  return builds;
}
