const webpack = require('webpack')
const path = require('path')

module.exports = config => {
  if (process.env.RELEASE)
    config.singleRun = true

  const customLaunchers = {
    // Browsers to run on BrowserStack.
    BS_Chrome: {
      base: 'BrowserStack',
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '47.0'
    },
    BS_Firefox: {
      base: 'BrowserStack',
      os: 'Windows',
      os_version: '10',
      browser: 'firefox',
      browser_version: '43.0'
    },
    BS_Safari: {
      base: 'BrowserStack',
      os: 'OS X',
      os_version: 'El Capitan',
      browser: 'safari',
      browser_version: '9.0'
    },
    BS_MobileSafari8: {
      base: 'BrowserStack',
      os: 'ios',
      os_version: '8.3',
      browser: 'iphone',
      real_mobile: false
    },
    BS_MobileSafari9: {
      base: 'BrowserStack',
      os: 'ios',
      os_version: '9.1',
      browser: 'iphone',
      real_mobile: false
    },
    BS_InternetExplorer10: {
      base: 'BrowserStack',
      os: 'Windows',
      os_version: '8',
      browser: 'ie',
      browser_version: '10.0'
    },
    BS_InternetExplorer11: {
      base: 'BrowserStack',
      os: 'Windows',
      os_version: '10',
      browser: 'ie',
      browser_version: '11.0'
    },

    // The ancient Travis Chrome that most projects use in CI.
    ChromeCi: {
      base: 'Chrome',
      flags: [ '--no-sandbox' ]
    }
  }

  config.set({
    customLaunchers: customLaunchers,

    browsers: [ 'Chrome' ],
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
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
          {
            test: /\.js$/,
            include: path.resolve('modules/'),
            exclude: /__tests__/,
            loader: 'isparta'
          }
        ]
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test')
        })
      ]
    },

    webpackServer: {
      noInfo: true
    },

    coverageReporter: {
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcovonly', subdir: '.' }
      ]
    }
  })

  if (process.env.USE_CLOUD) {
    config.browsers = Object.keys(customLaunchers)
    config.reporters[0] = 'dots'
    config.browserDisconnectTimeout = 10000
    config.browserDisconnectTolerance = 3
    config.browserNoActivityTimeout = 30000
    config.captureTimeout = 120000

    if (process.env.TRAVIS) {
      const buildLabel = 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')'

      config.browserStack = {
        username: process.env.BROWSER_STACK_USERNAME,
        accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
        pollingTimeout: 10000,
        startTunnel: true,
        project: 'react-router',
        build: buildLabel,
        name: process.env.TRAVIS_JOB_NUMBER
      }

      config.singleRun = true
    } else {
      config.browserStack = {
        username: process.env.BROWSER_STACK_USERNAME,
        accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
        pollingTimeout: 10000,
        startTunnel: true
      }
    }
  }
}
