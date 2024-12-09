const webpack = require('webpack')

module.exports = (config) => {
  if (process.env.RELEASE) config.singleRun = true

  config.set({
    browsers: [ 'ChromeHeadless' ],
    frameworks: [ 'mocha' ],
    reporters: [ 'mocha' ],

    files: [ 'tests.webpack.js' ],

    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ]
    },

    webpack: {
      devtool: 'inline-cheap-module-source-map',
      module: {
        rules: [
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
        ]
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test'),
          'process.env.NODE_DEBUG': JSON.stringify(false),
          __DEV__: true
        }),
        new webpack.ProvidePlugin({
          Buffer: [ 'buffer', 'Buffer' ]
        })
      ],
      resolve: {
        fallback: {
          assert: false,
          buffer: require.resolve('buffer/')
        }
      }
    },

    webpackServer: {
      noInfo: true
    },

    coverageReporter: {
      type: 'lcov',
      dir: 'coverage'
    }
  })

  if (process.env.CI) {
    config.singleRun = true

    config.concurrency = 2

    config.browserDisconnectTimeout = 10000
    config.browserDisconnectTolerance = 3
  }
}
