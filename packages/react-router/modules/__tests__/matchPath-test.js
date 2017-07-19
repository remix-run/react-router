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

  describe('with no path', () => {
    it('matches the root URL', () => {
      const match = matchPath('/test-location/7', {})
      expect(match).toMatch({
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

  describe('with dynamic segments in the path', () => {
    let url

    it('decodes them', () => {
      url = '/a%20dynamic%20segment'
      const match = matchPath(url, {
        path: '/:id',
        exact: true,
        strict: true
      })

      expect(match.isExact).toBe(true)
      expect(match.params.id).toBe('a dynamic segment')
    })

    it('correctly finds multiple params', () => {
      url = '/first/second'

      const match = matchPath(url, {
        path: '/:param1/:param2',
        exact: true,
        strict: true
      })

      expect(match.isExact).toBe(true)
      expect(match.params.param1).toBe('first')
      expect(match.params.param2).toBe('second')
    })

    it('correctly finds and decodes params in the middle of a complex path rule', () => {
      // This test case is modeled after a real-world case where we'd seen some inconsistent behavior
      url = '/foo/some%20param/edit'

      const match = matchPath(url, {
        path: '/foo/:param1/:param2(edit|view|history)?',
        exact: true,
        strict: false
      })

      expect(match.isExact).toBe(true)
      expect(match.params.param1).toBe('some param')
      expect(match.params.param2).toBe('edit')
    })

    it('correctly finds and decodes params in the middle of a complex path rule 2', () => {
      // This test case is modeled after a real-world case where we'd seen some inconsistent behavior
      url = '/foo/some%20param'

      const match = matchPath(url, {
        path: '/foo/:param1/:param2(edit|view|history)?',
        exact: true,
        strict: false
      })

      expect(match.isExact).toBe(true)
      expect(match.params.param1).toBe('some param')
      expect(match.params.param2).toBe(null)
    })

    it('correctly decodes params which have an encoded /', () => {
      url = '/foo%2fbar/baz'

      const match = matchPath(url, {
        path: '/:param1/baz',
        exact: true,
        strict: true
      })

      expect(match.isExact).toBe(true)
      expect(match.params.param1).toBe('foo/bar')
    })

    it('correctly decodes params which have an encoded :', () => {
      url = '/foo%3abar/baz'

      const match = matchPath(url, {
        path: '/:param1/baz',
        exact: true,
        strict: true
      })

      expect(match.isExact).toBe(true)
      expect(match.params.param1).toBe('foo:bar')
    })
  })
})
