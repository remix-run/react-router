import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.push('/home?the=query#the-hash', { the: 'state' })
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/home',
        search: '?the=query',
        hash: '#the-hash',
        state: { the: 'state' }
      })
    }
  ]

  execSteps(steps, history, done)
}
