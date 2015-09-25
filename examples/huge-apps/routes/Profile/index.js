module.exports = {
  path: 'profile',
  getComponent(location, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Profile'))
    })
  }
}
