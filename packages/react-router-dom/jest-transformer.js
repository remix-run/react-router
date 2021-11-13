const babelJest = require("babel-jest");

module.exports = babelJest.createTransformer({
  presets: [
    ["@babel/preset-env", { loose: true }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  plugins: ["babel-plugin-dev-expression"]
});
