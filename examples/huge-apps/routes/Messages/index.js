module.exports = {
  path: 'messages',

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Messages'))
    })
  }
}

