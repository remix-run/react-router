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

      history.goBack()
    },
    (location, action) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        pathname: '/'
      })

      unblock = history.block(nextLocation => {
        expect(nextLocation).toMatch({
          pathname: '/home'
        })

        return 'Are you sure?'
      })

      history.goForward()
    },
    (location, action) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        pathname: '/'
      })

      unblock()
    }
  ]

  execSteps(steps, history, done)
}
