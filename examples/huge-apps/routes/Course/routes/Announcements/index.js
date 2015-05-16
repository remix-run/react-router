module.exports = {
  path: 'announcements',

  getChildRoutes (cb) {
    require.ensure([
      './routes/Announcement',
    ], (require) => {
      cb(null, [
        require('./routes/Announcement')
      ])
    })
  },

  getComponents (cb) {
    require.ensure([
      './components/Announcements',
      './components/Sidebar',
    ], (require) => {
      cb(null, {
        sidebar: require('./components/Sidebar'),
        main: require('./components/Announcements'),
      });
    })
  }
};

