import Announcements from './routes/Announcements';
import Assignments from './routes/Assignments';
import Grades from './routes/Grades';

export default {
  path: 'course/:courseId',

  getChildRoutes(partialNextState, cb) {
    cb(null, [
      Announcements,
      Assignments,
      Grades
    ])
  },

  getComponent(nextState, cb) {
    System.import('./components/Course')
           .then(module => cb(null, module.default))
           .catch(err => console.error(`Partial module loading failed ${err}`))
  }
}
