const babelJest = require("babel-jest");

module.exports = babelJest.createTransformer({
  presets: ["@babel/preset-typescript", ["@babel/preset-env", { loose: true }], "@babel/preset-react"],
  plugins: ["babel-plugin-dev-expression"]
});
