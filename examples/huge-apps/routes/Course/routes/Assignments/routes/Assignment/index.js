export default {
  path: ':assignmentId',
  getComponent(nextState, cb) {
    System.import('./components/Assignment')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`)) // eslint-disable-line no-console
  }
}
