import expect from 'expect'
import resolveLocation from '../resolveLocation'

describe('resolveLocation', () => {
  const BASE = '/a/b'

  describe('empty base', () => {
    const cases = [
      ['', '/'],
      ['recipes', '/recipes'],
      ['/restaurants', '/restaurants'],
      ['.', '/'],
      ['..', '/'],
      ['../', '/'],
      [undefined, '/']
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

  describe('undefined location', () => {
    it('returns the base', () => {
      expect(resolveLocation(undefined, BASE)).toEqual(BASE)
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
        { search: '?c=d' },
        { hash: '#recipes' },
        {}
      ]
      descriptors.forEach(d => {
        expect(resolveLocation(d, BASE).pathname).toBe(BASE)
      })
    })
  })

  describe('slash strategy', () => {
    it('preserves pathname\'s slash strategy', () => {
      // this is mostly useful for dot notation and empty pathnames
      const cases = [
        // base without trailing slash
        ['/base', '', '/base'],
        ['/base', 'test', '/base/test'],
        ['/base', 'test/', '/base/test/'],
        ['/base', 'test/.', '/base/test'],
        ['/base', 'test/..', '/base'],
        // base with trailing slash
        ['/base/', '', '/base/'],
        ['/base/', 'test', '/base/test'],
        ['/base/', 'test/', '/base/test/'],
        ['/base/', 'test/.', '/base/test/'],
        ['/base/', 'test/..', '/base/']
      ]
      cases.forEach(([base, pathname, expected]) => {
        expect(resolveLocation(pathname, base)).toEqual(expected)
      })
    })
  })
})
