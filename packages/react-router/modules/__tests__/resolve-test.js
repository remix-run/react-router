import expect from 'expect'
import { resolveLocation, simpleResolve } from '../resolve'

describe('resolve', () => {

  describe('resolveLocation', () => {
    const BASE = '/a/b'

    describe('empty base', () => {
      const cases = [
        ['', '/'],
        ['recipes', '/recipes'],
        ['/restaurants', '/restaurants'],
        ['.', '/'],
        ['..', '/'],
        ['../', '/']
      ]

      it('works when base is empty string', () => {
        const BASE = ''
        cases.forEach(([input, output]) => {
          expect(resolveLocation(input, BASE)).toEqual(output)
        })
      })

      it('works when base is null', () => {
        const BASE = null
        cases.forEach(([input, output]) => {
          expect(resolveLocation(input, BASE)).toEqual(output)
        })
      })

      it('works when base is undefined', () => {
        const BASE = undefined
        cases.forEach(([input, output]) => {
          expect(resolveLocation(input, BASE)).toEqual(output)
        })
      })
    })

    describe('string location', () => {
      it('returns a string', () => {
        const path = 'recipes'
        expect(resolveLocation(path, BASE)).toBeA('string')
      })

      it('works for absolute pathnames', () => {
        const path = '/recipes'
        expect(resolveLocation(path, BASE)).toBe(path)
      })

      it('resolves to base when there is no pathname', () => {
        expect(resolveLocation(undefined, BASE)).toEqual(BASE)
      })
    })

    describe('object location', () => {
      it('returns an object with a pathname', () => {
        const location = { pathname: 'recipes' }
        const retLocation = resolveLocation(location)
        expect(retLocation).toBeA('object')
        expect(retLocation).toIncludeKey('pathname')
      })

      it('works for absolute pathname', () => {
        const descriptor = { pathname: '/recipes' }
        expect(resolveLocation(descriptor).pathname).toBe(descriptor.pathname)
      })

      it('resolves to base when there is no pathname', () => {
        const descriptors = [
          { query: {a: 'b'} },
          { query: {} },
          { search: '?a=b' },
          { hash: '#recipes' }
        ]
        descriptors.forEach(d => {
          expect(resolveLocation(d, BASE).pathname).toBe(BASE)
        })
      })
    })

    describe('slash strategy', () => {
      it('preserves pathnames slash strategy', () => {
        const cases = [
          ['recipes/', '/a/b/recipes/'],
          ['recipes', '/a/b/recipes'],
          ['../', '/a/']
        ]
        cases.forEach(([input, output]) => {
          expect(resolveLocation(input, BASE)).toEqual(output)
        })
      })

      it('removes trailing slash when pathname is removed by dot notation', () => {
        const cases = [
          ['restaurants/..', '/a/b'],
          ['restaurants/.', '/a/b/restaurants']
        ]
        cases.forEach(([input, output]) => {
          expect(resolveLocation(input, BASE)).toEqual(output)
        })
      })
    })
  })

  describe('simpleResolve', () => {
    it('returns pathname if it is absolute', () => {
      const pathname = '/recipes'
      expect(simpleResolve(pathname, '/base')).toEqual(pathname)
    })

    it('joins pathname with the base', () => {
      const pathname = 'recipes'
      expect(simpleResolve(pathname, '/base')).toEqual('/base/recipes')
    })

    it('correctly joins when base has a trailing slash', () => {
      const pathname = 'recipes'
      expect(simpleResolve(pathname, '/base/')).toEqual('/base/recipes')
    })

    describe('empty base', () => {
      const cases = [
        ['', '/'],
        ['recipes', '/recipes'],
        ['/restaurants', '/restaurants']
      ]

      it('works when base is empty string', () => {
        const BASE = ''
        cases.forEach(([input, output]) => {
          expect(simpleResolve(input, BASE)).toEqual(output)
        })
      })

      it('works when base is null', () => {
        const BASE = null
        cases.forEach(([input, output]) => {
          expect(simpleResolve(input, BASE)).toEqual(output)
        })
      })

      it('works when base is undefined', () => {
        const BASE = undefined
        cases.forEach(([input, output]) => {
          expect(simpleResolve(input, BASE)).toEqual(output)
        })
      })
    })
  })
})
