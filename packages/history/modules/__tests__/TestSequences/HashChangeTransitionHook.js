import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  let unblock, hookWasCalled = false
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      unblock = history.block(() => {
        hookWasCalled = true
      })

      window.location.hash = 'something-new'
    },
    (location) => {
      expect(location).toMatch({
        pathname: '/',
        hash: '#something-new'
      })

      expect(hookWasCalled).toBe(true)

      unblock()
    }
  ]

  execSteps(steps, history, done)
}
