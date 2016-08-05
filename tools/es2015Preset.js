const { buildPreset } = require('babel-preset-es2015')

const { BABEL_ENV } = process.env

module.exports = {
  presets: [
    [ buildPreset, {
      loose: true,
      modules: BABEL_ENV === 'es' ? false : 'commonjs'
    } ]
  ]
}
