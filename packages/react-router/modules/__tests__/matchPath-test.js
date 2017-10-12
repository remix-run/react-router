import matchPath from '../matchPath'

describe('matchPath', () => {
  describe('with path="/"', () => {
    it('returns correct url at "/"', () => {
      const path = '/'
      const pathname = '/'
      const match = matchPath(pathname, path)
      expect(match).toMatchObject({
        url: '/',
        isExact: true
      })
    })

    it('returns null for non-exact pathnames', () => {
      const path = '/'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, path)
      expect(match).toBe(null)
    })
  })

  describe('with path="/somewhere"', () => {
    it('returns correct url at "/somewhere"', () => {
      const path = '/somewhere'
      const pathname = '/somewhere'
      const match = matchPath(pathname, path)
      expect(match.url).toBe('/somewhere')
    })

    it('returns correct url at "/"', () => {
      const path = '/somewhere'
      const pathname = '/'
      const match = matchPath(pathname, path)
      expect(match).toBe(null)
    })
  })

  describe('with end = false', () => {
    it('allows partial matches', () => {
      const path = '/'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, { path, end: false })
      expect(match).toMatchObject({
        url: '/',
        isExact: false
      })
    })
  })

  describe('with sensitive path', () => {
    it('returns non-sensitive url', () => {
      const options = {
        path: '/SomeWhere',
      }
      const pathname = '/somewhere'
      const match = matchPath(pathname, options)
      expect(match.url).toBe('/somewhere')
    })

    it('returns sensitive url', () => {
      const options = {
        path: '/SomeWhere',
        sensitive: true
      }
      const pathname = '/somewhere'
      const match = matchPath(pathname, options)
      expect(match).toBe(null)
    })
  })

  describe('with no path', () => {
    it('only matches the root URL', () => {
      const rootMatch = matchPath('/', {})
      expect(rootMatch).toMatchObject({
        url: '/',
        path: '/',
        params: {},
        isExact: true
      })
      const nonRootMatch = matchPath('/test-location/7', {})
      expect(nonRootMatch).toBe(null)
    })

    it('matches all locations if end=false', () => {
      const match = matchPath('/test-location/7', { end: false })
      expect(match).toMatchObject({
        path: '/',
        isExact: false
      })
    })
  })

  describe('cache', () => {
    it('creates a cache entry for each end/strict pair', () => {
      // true/false and false/true will collide when adding booleans
      const trueFalse = matchPath(
        '/one/two',
        { path: '/one/two/', end : true, strict: false }
      )
      const falseTrue = matchPath(
        '/one/two',
        { path: '/one/two/', end : false, strict: true }
      )
      expect(!!trueFalse).toBe(true)
      expect(!!falseTrue).toBe(false)
    })
  })
})
