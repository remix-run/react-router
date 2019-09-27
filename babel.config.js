module.exports = {
  babelrcRoots: [".", "./website/*"],
  presets: [["@babel/env", { loose: true }], "@babel/react"],
  plugins: [
    "dev-expression",
    ["@babel/plugin-proposal-class-properties", { loose: true }]
  ],
  env: {
    test: {
      presets: [["@babel/preset-env", { targets: { node: "current" } }]]
    }
  }
};
