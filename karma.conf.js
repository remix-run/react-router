var glob = require('glob');

module.exports = function (config) {
  config.set({

    basePath: '',

    frameworks: [ 'mocha', 'browserify' ],

    files: glob.sync('modules/**/__tests__/*-test.js'),

    exclude: [],

    preprocessors: {
      'modules/**/__tests__/*-test.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      watch: true,
      transform: [
        [ 'reactify', { 'es6': true } ],
        'envify'
      ]
    },

    reporters: [ 'progress' ],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: [ 'Chrome' ],

    captureTimeout: 60000,

    singleRun: false
  });
};
