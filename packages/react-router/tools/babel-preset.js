const babelEnv = process.env.BABEL_ENV;
const building = babelEnv != undefined && babelEnv !== "cjs";

const plugins = ["dev-expression"];

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
