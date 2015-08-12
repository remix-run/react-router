module.exports = {
  path: ':assignmentId',

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Assignment'));
    })
  }
};

