module.exports = {
  path: 'assignments',

  getChildRoutes (location, cb) {
    require.ensure([], (require) => {
      cb(null, [
        require('./routes/Assignment')
      ])
    })
  },

  getComponents (location, cb) {
    require.ensure([], (require) => {
      cb(null, {
        sidebar: require('./components/Sidebar'),
        main: require('./components/Assignments'),
      });
    })
  }
};

