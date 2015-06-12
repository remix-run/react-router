module.exports = {
  path: 'calendar',

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Calendar'))
    })
  }
}

