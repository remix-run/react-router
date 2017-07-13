import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      history.replace('/home?the=query#the-hash', { the: 'state' })
    },
    (location, action) => {
      expect(action).toBe('REPLACE')
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
