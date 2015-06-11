module.exports = {
  path: 'grades',

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Grades'));
    })
  }
};

