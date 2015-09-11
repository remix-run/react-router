module.exports = {
  path: 'grades',

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Grades'));
    })
  }
};

