export default {
  path: 'profile',
  getComponent(nextState, cb) {
    System.import('./components/Profile')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`))
  }
}
