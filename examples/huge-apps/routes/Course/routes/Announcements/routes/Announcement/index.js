export default {
  path: ':announcementId',

  getComponent(nextState, cb) {
    System.import('./components/Announcement')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`)) // eslint-disable-line no-console
  }
}
