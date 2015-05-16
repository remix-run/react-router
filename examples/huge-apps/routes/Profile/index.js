module.exports = {
  path: 'profile',

  getComponents (cb) {
    require.ensure(['./components/Profile'], (require) => {
      cb(null, require('./components/Profile'));
    });
  }
};

