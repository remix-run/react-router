import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.push('/home?the=query#the-hash')
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/home',
        search: '?the=query',
        hash: '#the-hash'
      })

      history.push('?another=query#another-hash')
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/home',
        search: '?another=query',
        hash: '#another-hash'
      })
    }
  ]

  execSteps(steps, history, done)
}
