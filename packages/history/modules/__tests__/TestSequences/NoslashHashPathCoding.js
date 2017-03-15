import expect from 'expect'
import execSteps from './execSteps'

export default (history, done) => {
  const steps = [
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      // IE 10+ gives us "#", everyone else gives us ""
      expect(window.location.hash).toMatch(/^#?$/)

      history.push('/home?the=query#the-hash')
    },
    (location) => {
      expect(location).toMatch({
        pathname: '/home',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(window.location.hash).toBe('#home?the=query#the-hash')

      history.goBack()
    },
    (location) => {
      expect(location).toMatch({
        pathname: '/'
      })

      // IE 10+ gives us "#", everyone else gives us ""
      expect(window.location.hash).toMatch(/^#?$/)

      history.goForward()
    },
    (location) => {
      expect(location).toMatch({
        pathname: '/home',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(window.location.hash).toBe('#home?the=query#the-hash')
    }
  ]

  execSteps(steps, history, done)
}
