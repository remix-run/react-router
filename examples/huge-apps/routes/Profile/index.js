module.exports = {
  path: 'profile',

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Profile'));
    });
  }
};

