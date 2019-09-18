const commonConfig = {
  presets: [["@babel/env", { loose: true }], "@babel/react"],
  plugins: ["dev-expression"]
};

module.exports = {
  babelrcRoots: [".", "packages/react-router-native/", "website/"],
  overrides: [
    {
      test: "./packages/react-router/modules/*",
      presets: commonConfig.presets,
      plugins: commonConfig.plugins.concat([
        ["@babel/proposal-class-properties", { loose: true }]
      ])
    },
    {
      test: "./packages/react-router-dom/modules/*",
      presets: commonConfig.presets,
      plugins: commonConfig.plugins.concat([
        ["@babel/proposal-class-properties", { loose: true }]
      ])
    },
    {
      test: "./packages/react-router-config/modules/*",
      presets: commonConfig.presets,
      plugins: commonConfig.plugins
    },
    {
      test: "./packages/website/modules/*",
      presets: commonConfig.presets,
      plugins: commonConfig.plugins.concat([
        "transform-class-properties",
        ["transform-object-rest-spread", { useBuiltIns: true }],
        "transform-export-default"
      ])
    }
  ]
};
