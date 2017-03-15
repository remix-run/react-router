import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.replace('/home', { the: 'state' })
    },
    (location, action) => {
      expect(action).toBe('REPLACE')
      expect(location).toMatch({
        pathname: '/home',
        state: undefined
      })

      // We should see a warning message.
      expect(warningMessage).toMatch('Hash history cannot replace state; it is ignored')
    }
  ]

  let consoleError = console.error // eslint-disable-line no-console
  let warningMessage

  console.error = (message) => { // eslint-disable-line no-console
    warningMessage = message
  }

  execSteps(steps, history, (...args) => {
    console.error = consoleError // eslint-disable-line no-console
    done(...args)
  })
}
