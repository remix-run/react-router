const babelJest = require("babel-jest").default;

module.exports = babelJest.createTransformer({
  presets: [
    ["@babel/preset-env", { loose: true }],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: ["babel-plugin-dev-expression"],
});
