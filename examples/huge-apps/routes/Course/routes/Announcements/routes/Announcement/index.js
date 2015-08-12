module.exports = {
  path: ':announcementId',

  getComponents (state, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Announcement'));
    })
  }
};

