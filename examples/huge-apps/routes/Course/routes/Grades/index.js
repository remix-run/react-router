export default {
  path: 'grades',
  getComponent(nextState, cb) {
    System.import('./components/Grades')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`))
  }
}
