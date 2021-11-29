const webpack = require('webpack')

module.exports = config => {
  if (process.env.RELEASE)
    config.singleRun = true

  config.set({
    customLaunchers: {
      ChromeCi: {
        base: 'ChromeHeadless',
        flags: [ '--no-sandbox' ]
      }
    },

    browsers: [ 'ChromeCi' ],
    frameworks: [ 'mocha' ],
    reporters: [ 'mocha', 'coverage' ],

    files: [
      'tests.webpack.js'
    ],

    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ]
    },

    webpack: {
      devtool: 'cheap-module-inline-source-map',
      module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
        ]
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test'),
          __DEV__: true
        })
      ]
    },

    webpackServer: {
      noInfo: true
    },

    coverageReporter: {
      type: 'lcov',
      dir: 'coverage'
    }
  })
}
