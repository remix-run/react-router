import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  let unblock
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

      unblock = history.block(nextLocation => {
        expect(nextLocation).toMatch({
          pathname: '/'
        })

        return 'Are you sure?'
      })

      history.goBack()
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/home'
      })

      unblock()
    }
  ]

  execSteps(steps, history, done)
}
