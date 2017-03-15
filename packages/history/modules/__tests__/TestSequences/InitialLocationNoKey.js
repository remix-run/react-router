import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location.key).toNotExist()
    }
  ]

  execSteps(steps, history, done)
}
