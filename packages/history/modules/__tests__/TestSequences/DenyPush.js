import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      const unblock = history.block(nextLocation => {
        expect(nextLocation).toMatch({
          pathname: '/home'
        })

        return 'Are you sure?'
      })

      history.push('/home')

      expect(history.location).toMatch({
        pathname: '/'
      })

      unblock()
    }
  ]

  execSteps(steps, history, done)
}
