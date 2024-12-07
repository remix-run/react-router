const webpack = require('webpack')
const projectName = require('./package').name

module.exports = (config) => {
  if (process.env.RELEASE) config.singleRun = true

  config.set({
    browsers: [ 'ChromeHeadless' ],
    frameworks: [ 'mocha' ],
    reporters: [ 'mocha', 'coverage' ],

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

  if (process.env.USE_CLOUD) {
    config.browsers = Object.keys(customLaunchers)
    config.reporters[0] = 'dots'
    config.concurrency = 2

    config.browserDisconnectTimeout = 10000
    config.browserDisconnectTolerance = 3

    if (process.env.TRAVIS) {
      config.browserStack = {
        project: projectName,
        build: process.env.TRAVIS_BUILD_NUMBER,
        name: process.env.TRAVIS_JOB_NUMBER
      }

      config.singleRun = true
    } else {
      config.browserStack = {
        project: projectName
      }
    }
  }
}
