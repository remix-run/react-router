const babelEnv = process.env.BABEL_ENV;
const buildPreset = require("babel-preset-es2015").buildPreset;

module.exports = {
  presets: [
    [
      buildPreset,
      {
        loose: true,
        modules: babelEnv === "es" ? false : "commonjs"
      }
    ]
  ]
};
