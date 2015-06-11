module.exports = {
  path: 'announcements',

  getChildRoutes (state, cb) {
    require.ensure([], (require) => {
      cb(null, [
        require('./routes/Announcement')
      ])
    })
  },

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, {
        sidebar: require('./components/Sidebar'),
        main: require('./components/Announcements'),
      });
    })
  }
};

