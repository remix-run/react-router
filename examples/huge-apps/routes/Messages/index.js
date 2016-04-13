module.exports = {
  path: 'messages',
  getComponent(nextState, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Messages'))
    })
  }
}
