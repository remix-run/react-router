module.exports = {
  path: 'messages',

  getComponent (location, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Messages'))
    })
  }
}

