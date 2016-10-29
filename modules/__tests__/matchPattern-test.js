import expect from 'expect'
import matchPattern from '../matchPattern'

describe('matchPattern', () => {

  describe('pattern matches', () => {
    it('returns object with pathname, params, and isExact', () => {
      const location = { pathname: '/foo' }
      const pattern = '/foo'
      const match = matchPattern(pattern, location, false, null)
      expect(match).toIncludeKeys(['pathname', 'params', 'isExact'])
    })

    describe('pathname', () => {
      it('is the matched part of the location\'s pathname', () => {
        const location = { pathname: '/foo' }
        const pattern = '/foo'
        const match = matchPattern(pattern, location, false, null)
        expect(match.pathname).toBe(location.pathname)
      })

      it('leaves out unmatched parts of the location\'s pathname', () => {
        const location = { pathname: '/bar/foo' }
        const pattern = '/bar'
        const match = matchPattern(pattern, location, false, null)
        expect(match.pathname).toBe(pattern)
      })

      it('includes parent pathname for relative patterns', () => {
        const parent = { pathname: '/bar' }
        const pattern = 'foo'
        const location = { pathname: `${parent.pathname}/${pattern}` }
        const match = matchPattern(pattern, location, false, parent)
        expect(match.pathname).toBe(location.pathname)
      })
    })

    describe('params', () => {
      it('sets params in params object', () => {
        const key = 'word'
        const value = 'foo'
        const location = { pathname: `/${value}` }
        const pattern = `/:${key}`
        const match = matchPattern(pattern, location, false, null)
        expect(match.params[key]).toBe(value)
      })

      describe('optional param', () => {
        it('is included when defined', () => {
          const defined = 'foo'
          const optional = 'bar'
          const location = { pathname: '/foo/bar' }
          const pattern = `/:${defined}/:${optional}?`
          const match = matchPattern(pattern, location, false, null)
          expect(match.params).toIncludeKeys([defined, optional])
        })

        it('is not included when undefined', () => {
          const defined = 'foo'
          const optional = 'bar'
          const location = { pathname: '/foo' }
          const pattern = `/:${defined}/:${optional}?`
          const match = matchPattern(pattern, location, false, null)
          expect(match.params).toIncludeKey(defined)
          expect(match.params).toExcludeKey(optional)
        })
      })
    })

    describe('isExact', () => {
      const location = { pathname: '/bar/foo' }

      it('is true for exact matches', () => {
        const pattern = '/bar/foo'
        const match = matchPattern(pattern, location, false, null)
        expect(match.isExact).toBe(true)
      })

      it('is false for partial matches', () => {
        const pattern = '/bar'
        const match = matchPattern(pattern, location, false, null)
        expect(match.isExact).toBe(false)
      })
    })
  })


  describe('pattern does not match', () => {
    it('returns null', () => {
      const location = { pathname: '/foo' }
      const pattern = '/bar'
      const match = matchPattern(pattern, location, false, null)
      expect(match).toBe(null)
    })
  })

  describe('matchExactly', () => {
    it('returns null for non-exact matches', () => {
      const location = { pathname: '/bar/foo' }
      const pattern = '/bar'

      const inexactMatch = matchPattern(pattern, location, false, null)
      expect(inexactMatch).toNotBe(null)

      const exactMatch = matchPattern(pattern, location, true, null)
      expect(exactMatch).toBe(null)
    })
  })

  describe('parent', () => {
    it('uses parent pathname for relative patterns', () => {
      const location = { pathname: '/bar/foo' }
      const parent = { pathname: '/bar'}
      const pattern = 'foo'
      const match = matchPattern(pattern, location, false, parent)
      expect(match).toNotBe(null)
    })

    it('correctly joins parent pathname to pattern', () => {
      const location = { pathname: '/bar/foo' }
      const pattern = 'foo'
      const parentPathnames = [
        '/bar',
        '/bar/'
      ]
      parentPathnames.forEach(pathname => {
        const match = matchPattern(pattern, location, false, { pathname })
        expect(match.pathname).toBe('/bar/foo')
      })
    })

    it('is not used for absolute patterns', () => {
      const location = { pathname: '/bar/foo' }
      const parent = { pathname: '/bar'}
      const pattern = '/foo'
      const match = matchPattern(pattern, location, false, parent)
      expect(match).toBe(null)
    })
  })
})
