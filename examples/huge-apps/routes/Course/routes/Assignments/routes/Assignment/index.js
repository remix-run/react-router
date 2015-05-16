module.exports = {
  path: ':assignmentId',

  getComponents (cb) {
    require.ensure([
      './components/Assignment',
    ], (require) => {
      cb(null, require('./components/Assignment'));
    })
  }
};

