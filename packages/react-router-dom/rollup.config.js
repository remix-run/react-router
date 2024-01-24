const path = require("path");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const extensions = require("rollup-plugin-extensions");
const prettier = require("rollup-plugin-prettier");
const replace = require("@rollup/plugin-replace");
const { terser } = require("rollup-plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const {
  babelPluginReplaceVersionPlaceholder,
  createBanner,
  getBuildDirectories,
  validateReplacedVersion,
  PRETTY,
} = require("../../rollup.utils");
const { name, version } = require("./package.json");

module.exports = function rollup() {
  const { ROOT_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(name);

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
      external: ["react", "react-dom", "react-router", "@remix-run/router"],
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
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
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
        validateReplacedVersion(),
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
      external: ["react", "react-router", "@remix-run/router"],
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
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react-router-dom.production.min.js`,
        format: "esm",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
      },
      external: ["react", "react-router", "@remix-run/router"],
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
          "@remix-run/router": "RemixRouter",
          react: "React",
          "react-router": "ReactRouter",
        },
        name: "ReactRouterDOM",
      },
      external: ["react", "react-router", "@remix-run/router"],
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
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react-router-dom.production.min.js`,
        format: "umd",
        sourcemap: !PRETTY,
        banner: createBanner("React Router DOM", version),
        globals: {
          "@remix-run/router": "RemixRouter",
          react: "React",
          "react-router": "ReactRouter",
        },
        name: "ReactRouterDOM",
      },
      external: ["react", "react-router", "@remix-run/router"],
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
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        typescript({
          tsconfig: path.join(__dirname, "tsconfig.json"),
          include: ["server.tsx"],
          exclude: ["__tests__"],
          noEmitOnError: true,
        }),
        validateReplacedVersion(),
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
          plugins: [
            "babel-plugin-dev-expression",
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: [".ts", ".tsx"],
        }),
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: "babel" }) : []),
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
