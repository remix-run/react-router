module.exports = {
  path: 'assignments',

  getChildRoutes (cb) {
    require.ensure([
      './routes/Assignment',
    ], (require) => {
      cb(null, [
        require('./routes/Assignment')
      ])
    })
  },

  getComponents (cb) {
    require.ensure([
      './components/Assignments',
      './components/Sidebar',
    ], (require) => {
      cb(null, {
        sidebar: require('./components/Sidebar'),
        main: require('./components/Assignments'),
      });
    })
  }
};

