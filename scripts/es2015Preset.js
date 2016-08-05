const babelPresetEs2015 = require('babel-preset-es2015')

const { BABEL_ENV } = process.env

module.exports = {
  presets: [
    [ babelPresetEs2015, {
      loose: true,
      modules: BABEL_ENV === 'es' ? false : 'commonjs'
    } ]
  ]
}
