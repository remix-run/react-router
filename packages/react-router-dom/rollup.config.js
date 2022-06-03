const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const extensions = require("rollup-plugin-extensions");
const prettier = require("rollup-plugin-prettier");
const replace = require("@rollup/plugin-replace");
const { terser } = require("rollup-plugin-terser");
const {
  buildDir,
  createBanner,
  getVersion,
  PRETTY,
} = require("../../rollup.utils");

module.exports = function rollup() {
  const SOURCE_DIR = path.relative(process.cwd(), __dirname) || ".";
  const OUTPUT_DIR = path.join(buildDir, "node_modules/react-router-dom");
  const version = getVersion(SOURCE_DIR);

  // JS modules for bundlers
  const modules = [
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
        file: `${OUTPUT_DIR}/react-router-dom.production.min.js`,
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
        // compiler(),
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
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
        file: `${OUTPUT_DIR}/umd/react-router-dom.production.min.js`,
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
        banner: createBanner("React Router DOM", version),
      },
      plugins: [].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/server.tsx`,
      output: {
        file: `${OUTPUT_DIR}/server.js`,
        format: "cjs",
      },
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
        // compiler()
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
    {
      input: `${SOURCE_DIR}/server.tsx`,
      output: {
        file: `${OUTPUT_DIR}/server.mjs`,
        format: "esm",
      },
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
        // compiler()
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals, ...node];
};
