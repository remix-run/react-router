import path from 'path'
import webpack from 'webpack'

// Browsers to run on BrowserStack
const CUSTOM_LAUNCHERS = {
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
//  BS_InternetExplorer9: {
//    base: 'BrowserStack',
//    os: 'Windows',
//    os_version: '7',
//    browser: 'ie',
//    browser_version: '9.0'
//  },
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

function setBrowserStack(config, project) {
  const { env } = process

  if (env.USE_CLOUD) {
    config.set({
      customLaunchers: CUSTOM_LAUNCHERS,
      browsers: Object.keys(CUSTOM_LAUNCHERS),
      reporters: [ 'dots', 'coverage' ],
      browserDisconnectTimeout: 10000,
      browserDisconnectTolerance: 3,
      browserNoActivityTimeout: 30000,
      captureTimeout: 120000,
      browserStack: {
        username: env.BROWSER_STACK_USERNAME,
        accessKey: env.BROWSER_STACK_ACCESS_KEY,
        pollingTimeout: 10000,
        startTunnel: true
      }
    })

    if (env.TRAVIS) {
      Object.assign(config.browserStack, {
        startTunnel: false,
        project,
        build: `TRAVIS #${env.TRAVIS_BUILD_NUMBER} (${env.TRAVIS_BUILD_ID})`,
        name: env.TRAVIS_JOB_NUMBER
      })
    }
  }
}

export default config => {
  const { env } = process

  const isCi = env.CONTINUOUS_INTEGRATION === 'true'
  const runCoverage = env.COVERAGE === 'true' || isCi

  const coverageLoaders = []
  const coverageReporters = []

  if (runCoverage) {
    coverageLoaders.push({
      test: /\.js$/,
      include: path.resolve('modules/'),
      exclude: /__tests__/,
      loader: 'isparta'
    })

    coverageReporters.push('coverage')
  }

  config.set({
    frameworks: [ 'mocha' ],

    files: [ 'tests.webpack.js' ],

    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ]
    },

    webpack: {
      module: {
        loaders: [
          { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
          ...coverageLoaders
        ]
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('test')
        })
      ],
      devtool: 'inline-source-map'
    },

    webpackMiddleware: {
      noInfo: true
    },

    reporters: [ 'mocha', ...coverageReporters ],

    coverageReporter: {
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcovonly', subdir: '.' }
      ]
    },

    browsers: [ 'Chrome' ],

    singleRun: isCi
  })

  setBrowserStack(config, 'react-router')
}
