export default {
  path: 'messages',
  getComponent(nextState, cb) {
    System.import('./components/Messages')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`)) // eslint-disable-line no-console
  }
}
