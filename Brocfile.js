module.exports = require('broccoli-dist-es6-module')('lib', {
  global: 'rf.router',
  packageName: 'rf-router',
  main: 'main',
  shim: {
    'react': 'React'
  }
});

