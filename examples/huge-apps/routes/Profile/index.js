module.exports = {
  path: 'profile',
  getComponent(nextState, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Profile'))
    })
  }
}
