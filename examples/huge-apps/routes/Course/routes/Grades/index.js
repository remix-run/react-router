module.exports = {
  path: 'grades',
  getComponent(nextState, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Grades'))
    })
  }
}
