module.exports = {
  path: 'course/:courseId',

  getChildRoutes (cb) {
    require.ensure([
      './routes/Announcements',
      './routes/Assignments',
      './routes/Grades',
    ], (require) => {
      cb(null, [
        require('./routes/Announcements'),
        require('./routes/Assignments'),
        require('./routes/Grades'),
      ])
    })
  },

  getComponents (cb) {
    require.ensure(['./components/Course'], (require) => {
      cb(null, require('./components/Course'))
    })
  }
};

