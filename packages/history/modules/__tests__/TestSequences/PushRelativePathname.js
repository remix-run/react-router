import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.push('/the/path?the=query#the-hash')
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      history.push('../other/path?another=query#another-hash')
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/other/path',
        search: '?another=query',
        hash: '#another-hash'
      })
    }
  ]

  execSteps(steps, history, done)
}
