module.exports = {
  path: ':announcementId',

  getComponent(location, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Announcement'))
    })
  }
}
