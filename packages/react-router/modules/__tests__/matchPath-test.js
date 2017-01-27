import expect from 'expect'
import matchPath from '../matchPath'

describe('matchPath', () => {
  describe('with path="/"', () => {
    it('returns correct url at "/"', () => {
      const path = '/'
      const pathname = '/'
      const match = matchPath(pathname, path)
      expect(match.url).toBe('/')
    })

    it('returns correct url at "/somewhere/else"', () => {
      const path = '/'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, path)
      expect(match.url).toBe('/')
    })
  })

  describe('with path="/somewhere"', () => {
    it('returns correct url at "/somewhere"', () => {
      const path = '/somewhere'
      const pathname = '/somewhere'
      const match = matchPath(pathname, path)
      expect(match.url).toBe('/somewhere')
    })

    it('returns correct url at "/somewhere/else"', () => {
      const path = '/somewhere'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, path)
      expect(match.url).toBe('/somewhere')
    })
  })
})
