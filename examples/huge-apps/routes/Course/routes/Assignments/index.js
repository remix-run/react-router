module.exports = {
  path: 'assignments',

  getChildRoutes (state, cb) {
    require.ensure([], (require) => {
      cb(null, [
        require('./routes/Assignment')
      ])
    })
  },

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, {
        sidebar: require('./components/Sidebar'),
        main: require('./components/Assignments'),
      });
    })
  }
};

