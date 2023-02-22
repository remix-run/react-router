const { createRequire } = require("module");
const babelJest = require("babel-jest");

const rnRequire = createRequire(require.resolve("react-native"));

module.exports = babelJest.createTransformer({
  presets: [
    "@babel/preset-typescript",
    // RN bundles this preset, so let's load it instead of depending on it ourselves
    rnRequire.resolve("metro-react-native-babel-preset"),
  ],
  plugins: ["babel-plugin-dev-expression"],
});
