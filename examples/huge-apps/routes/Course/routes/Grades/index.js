module.exports = {
  path: 'grades',

  getComponents (cb) {
    require.ensure([
      './components/Grades',
    ], (require) => {
      cb(null, require('./components/Grades'));
    })
  }
};

