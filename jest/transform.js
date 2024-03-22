let { default: babelJest } = require("babel-jest");

/**
 * Replace `import.meta` with `undefined`
 *
 * Needed to support server-side CJS in Jest
 * when `import.meta.hot` is used for HMR.
 */
let metaPlugin = ({ types: t }) => ({
  visitor: {
    MetaProperty: (path) => {
      path.replaceWith(t.identifier("undefined"));
    },
  },
});

module.exports = babelJest.createTransformer({
  babelrc: false,
  presets: [
    ["@babel/preset-env", { loose: true }],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: ["babel-plugin-dev-expression", metaPlugin],
});
