const babelEnv = process.env.BABEL_ENV;
const building = babelEnv != undefined && babelEnv !== "cjs";

module.exports = {
  plugins: ["dev-expression"],
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
