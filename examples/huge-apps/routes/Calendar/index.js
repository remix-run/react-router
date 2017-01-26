export default {
  path: 'calendar',
  getComponent(nextState, cb) {
    System.import('./components/Calendar')
    .then(module => cb(null, module.default))
    .catch(err => console.error(`Partial module loading failed ${err}`))
  }
}
