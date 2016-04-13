module.exports = {
  path: 'announcements',

  getChildRoutes(location, cb) {
    require.ensure([], (require) => {
      cb(null, [
        require('./routes/Announcement')
      ])
    })
  },

  getComponents(nextState, cb) {
    require.ensure([], (require) => {
      cb(null, {
        sidebar: require('./components/Sidebar'),
        main: require('./components/Announcements')
      })
    })
  }
}
