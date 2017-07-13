import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      const pathname = '/歴史'
      const search = '?キー=値'
      const hash = '#ハッシュ'
      history.push(pathname + search + hash)
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        pathname: '/歴史',
        search: '?キー=値',
        hash: '#ハッシュ'
      })
    }
  ]

  execSteps(steps, history, done)
}
