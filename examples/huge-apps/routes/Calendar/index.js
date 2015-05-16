module.exports = {
  path: 'calendar',

  getComponents (cb) {
    require.ensure(['./components/Calendar'], (require) => {
      cb(null, require('./components/Calendar'))
    })
  }
}

