module.exports = {
  presets: [["@babel/env", { loose: true }], "@babel/react"],
  plugins: [
    "dev-expression",
    "transform-class-properties",
    ["transform-object-rest-spread", { useBuiltIns: true }],
    "transform-export-default"
  ]
};
