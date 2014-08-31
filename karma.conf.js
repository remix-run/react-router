module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['mocha'],

    files: [
      'specs/main.js'
    ],

    exclude: [],

    preprocessors: {
      'specs/main.js': ['webpack']
    },

    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {test: /\.js$/, loader: 'jsx-loader'}
        ]
      }
    },

    webpackServer: {
      stats: {
        colors: true
      }
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome'],

    captureTimeout: 60000,

    singleRun: false
  });
};
