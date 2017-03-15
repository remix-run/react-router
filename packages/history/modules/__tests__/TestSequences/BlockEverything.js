import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      const unblock = history.block()

      history.push('/home')

      expect(history.location).toMatch({
        pathname: '/'
      })

      unblock()
    }
  ]

  execSteps(steps, history, done)
}
