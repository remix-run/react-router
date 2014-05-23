module.exports = require('broccoli-dist-es6-module')('lib', {
  global: 'ReactRouter',
  packageName: 'rf-router',
  main: 'main',
  shim: {
    'react': 'React'
  }
});

