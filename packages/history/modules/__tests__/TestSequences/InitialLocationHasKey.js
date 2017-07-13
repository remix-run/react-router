import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location.key).toExist()
    }
  ]

  execSteps(steps, history, done)
}
