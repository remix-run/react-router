module.exports = {
  path: ':assignmentId',
  getComponent(location, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Assignment'))
    })
  }
}
