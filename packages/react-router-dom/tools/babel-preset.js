const babelEnv = process.env.BABEL_ENV;
const building = babelEnv != undefined && babelEnv !== "cjs";

const transformImports = require("babel-plugin-transform-imports");

const plugins = [
  "dev-expression",
  [
    transformImports,
    {
      "react-router": {
        transform: building
          ? "react-router/es/${member}"
          : "react-router/${member}",
        preventFullImport: true
      }
    }
  ]
];

if (process.env.NODE_ENV === "production") {
  plugins.push("transform-react-remove-prop-types");
}

module.exports = {
  plugins: plugins,
  presets: [
    [
      "es2015",
      {
        loose: true,
        modules: building ? false : "commonjs"
      }
    ],
    "stage-1",
    "react"
  ]
};
