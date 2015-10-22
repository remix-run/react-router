var webpack = require('webpack')
var path = require('path')

module.exports = function (config) {
  // Browsers to run on BrowserStack
  var customLaunchers = {
    BS_Chrome: {
      base: 'BrowserStack',
      os: 'Windows',
      os_version: '8.1',
      browser: 'chrome',
      browser_version: '39.0'
    },
    BS_Firefox: {
      base: 'BrowserStack',
      os: 'Windows',
      os_version: '8.1',
      browser: 'firefox',
      browser_version: '32.0'
    },
    BS_Safari: {
      base: 'BrowserStack',
      os: 'OS X',
      os_version: 'Yosemite',
      browser: 'safari',
      browser_version: '8.0'
    },
    BS_MobileSafari: {
      base: 'BrowserStack',
      os: 'ios',
      os_version: '7.0',
      browser: 'iphone',
      real_mobile: false
    },
//    BS_InternetExplorer9: {
//      base: 'BrowserStack',
//      os: 'Windows',
//      os_version: '7',
//      browser: 'ie',
//      browser_version: '9.0'
//    },
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
      os_version: '8.1',
      browser: 'ie',
      browser_version: '11.0'
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
      devtool: 'inline-source-map',
      module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
          { test: /\.js$/, exclude: /__tests__/, include: path.resolve('modules/'), loader: 'isparta' }
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
    config.reporters = [ 'dots' ]
    config.browserDisconnectTimeout = 10000
    config.browserDisconnectTolerance = 3
    config.browserNoActivityTimeout = 30000
    config.captureTimeout = 120000

    if (process.env.TRAVIS) {
      var buildLabel = 'TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')'

      config.browserStack = {
        username: process.env.BROWSER_STACK_USERNAME,
        accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
        pollingTimeout: 10000,
        startTunnel: false,
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
