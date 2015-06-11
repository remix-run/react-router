module.exports = {
  path: 'messages',

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Messages'))
    })
  }
}

