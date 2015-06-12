module.exports = {
  path: 'course/:courseId',

  getChildRoutes (state, cb) {
    require.ensure([], (require) => {
      cb(null, [
        require('./routes/Announcements'),
        require('./routes/Assignments'),
        require('./routes/Grades'),
      ])
    })
  },

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Course'))
    })
  }
};

