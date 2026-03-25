import babelJest from "babel-jest";

export default babelJest.createTransformer({
  babelrc: false,
  configFile: false,
  presets: [
    ["@babel/preset-env", { targets: { node: "current" }, modules: false }],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: ["babel-plugin-dev-expression"],
});
