module.exports = {
  path: 'profile',

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Profile'));
    });
  }
};

