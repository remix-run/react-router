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

  describe('with exact option', () => {
    it('returns match for exact match when exact=true', () => {
      const path = '/'
      const pathname = '/'
      const match = matchPath(pathname, { path, exact: true })
      expect(match).toMatchObject({
        url: '/',
        isExact: true
      })
    })

    it('returns match for non-exact match when exact=false', () => {
      const path = '/'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, { path, exact: false })
      expect(match).toMatchObject({
        url: '/',
        isExact: false
      })
    })

    it('returns null for non-exact match when exact=true', () => {
      const path = '/'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, { path, exact: true })
      expect(match).toBe(null)
    })
  })

  describe('with parent option', () => {
    it('returns match for non-exact match when parent=true', () => {
      const path = '/somewhere'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, { path, parent: true })
      expect(match).toMatchObject({
        path: '/somewhere',
        isExact: false
      })
    })

    it('returns match for exact match when parent=true', () => {
      const path = '/somewhere'
      const pathname = '/somewhere'
      const match = matchPath(pathname, { path, parent: true })
      expect(match).toMatchObject({
        path: '/somewhere',
        isExact: true
      })
    })

    it('returns null for non-exact match when parent=false', () => {
      const path = '/somewhere'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, { path, parent: false })
      expect(match).toBe(null)
    })
  })

  describe('with exact and parent options', () => {
    it('matches based on exact value', () => {
      const path = '/'
      const pathname = '/'
      const match = matchPath(pathname, { path, exact: true, parent: true })
      expect(match).toMatchObject({
        path: '/',
        isExact: true
      })
    })

    it('returns correct url at "/somewhere/else"', () => {
      const path = '/'
      const pathname = '/somewhere/else'
      const match = matchPath(pathname, { path, exact: true, parent: true })
      expect(match).toBe(null)
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
    it('matches the root URL', () => {
      const match = matchPath('/test-location/7', {})
      expect(match).toMatchObject({
        url: '/',
        path: '/',
        params: {},
        isExact: false
      })
    })
  })

  describe('cache', () => {
    it('creates a cache entry for each exact/strict pair', () => {
      // true/false and false/true will collide when adding booleans
      const trueFalse = matchPath(
        '/one/two',
        { path: '/one/two/', exact : true, strict: false }
      )
      const falseTrue = matchPath(
        '/one/two',
        { path: '/one/two/', exact : false, strict: true }
      )
      expect(!!trueFalse).toBe(true)
      expect(!!falseTrue).toBe(false)
    })
  })
})
