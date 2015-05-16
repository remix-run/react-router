module.exports = {
  path: 'messages',

  getComponents (cb) {
    require.ensure(['./components/Messages'], (require) => {
      cb(null, require('./components/Messages'))
    })
  }
}

