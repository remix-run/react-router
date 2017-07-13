import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.push('/home')
    },
    (location, action) => {
      expect(action).toEqual('PUSH')
      expect(location).toMatch({
        pathname: '/home'
      })

      history.goBack()
    },
    (location, action) => {
      expect(action).toEqual('POP')
      expect(location).toMatch({
        pathname: '/'
      })

      history.goForward()
    },
    (location, action) => {
      expect(action).toEqual('POP')
      expect(location).toMatch({
        pathname: '/home'
      })
    }
  ]

  execSteps(steps, history, done)
}
