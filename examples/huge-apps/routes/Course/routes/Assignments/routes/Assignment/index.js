module.exports = {
  path: ':assignmentId',

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Assignment'));
    })
  }
};

