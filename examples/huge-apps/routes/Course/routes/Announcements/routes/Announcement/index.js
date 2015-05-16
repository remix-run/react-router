module.exports = {
  path: ':announcementId',

  getComponents (cb) {
    require.ensure([
      './components/Announcement',
    ], (require) => {
      cb(null, require('./components/Announcement'));
    })
  }
};

