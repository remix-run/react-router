module.exports = {
  path: ':announcementId',

  getComponents (cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Announcement'));
    })
  }
};

