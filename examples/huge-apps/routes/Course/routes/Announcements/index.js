export default {
  path: 'announcements',

  getChildRoutes(partialNextState, cb) {
    System.import('./routes/Announcement')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`))
  },

  getComponents(nextState, cb) {
    Promise.all([
      System.import('./components/Sidebar'),
      System.import('./components/Announcements')
    ]).then(modules => cb(null, {
      sidebar: modules[0].default,
      main: modules[1].default
    }));
  }
}
