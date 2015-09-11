module.exports = {
  path: 'calendar',

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Calendar'))
    })
  }
}

