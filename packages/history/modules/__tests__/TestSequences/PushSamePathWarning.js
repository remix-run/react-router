import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  let prevLocation

  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.push('/home')
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/home'
      })

      prevLocation = location

      history.push('/home')
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/home'
      })

      // We should get the SAME location object. Nothing
      // new was added to the history stack.
      expect(location).toBe(prevLocation)

      // We should see a warning message.
      expect(warningMessage).toMatch('Hash history cannot PUSH the same path; a new entry will not be added to the history stack')
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
