import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  let prevLocation

  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.replace('/home')
    },
    (location, action) => {
      expect(action).toBe('REPLACE')
      expect(location).toMatch({
        pathname: '/home'
      })

      prevLocation = location

      history.replace('/home')
    },
    (location, action) => {
      expect(action).toBe('REPLACE')
      expect(location).toMatch({
        pathname: '/home'
      })

      expect(location).toNotBe(prevLocation)
    }
  ]

  execSteps(steps, history, done)
}
