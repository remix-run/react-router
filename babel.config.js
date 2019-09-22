module.exports = {
  babelrcRoots: [".", "./packages/react-router-native/*", "./website/*"],
  presets: [["@babel/env", { loose: true }], "@babel/react"],
  plugins: ["dev-expression"],
  env: {
    test: {
      presets: [["@babel/preset-env", { targets: { node: "current" } }]]
    }
  },
  overrides: [
    {
      test: "./packages/react-router/modules/*",
      plugins: [["@babel/plugin-proposal-class-properties", { loose: true }]]
    },
    {
      test: "./packages/react-router-dom/modules/*",
      plugins: [["@babel/plugin-proposal-class-properties", { loose: true }]]
    }
  ]
};
