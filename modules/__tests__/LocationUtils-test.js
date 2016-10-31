import expect from 'expect'
import { parse, stringify } from 'query-string'
import {
  createRouterLocation,
  createRouterPath,
  resolveLocation
} from '../LocationUtils'

describe('LocationUtils', () => {
  describe('createRouterLocation', () => {
    describe('string', () => {
      it('returns object with pathname, search, hash, and query', () => {
        const url = '/foo'
        const location = createRouterLocation(url, parse)
        expect(location).toIncludeKeys(['pathname', 'search', 'hash', 'query'])
      })

      describe('query', () => {
        it('creates the query value from the search string', () => {
          const key = 'bar'
          const value = 'baz'
          const url = `/foo?${key}=${value}`
          const location = createRouterLocation(url, parse)
          expect(location.query[key]).toBe(value)
        })

        it('sets the query value to null when there is no search string', () => {
          const url = '/foo'
          const location = createRouterLocation(url, parse)
          expect(location.query).toBe(null)
        })
      })

    })

    describe('object', () => {

      it('returns object with pathname, search, hash, query, and state', () => {
        const descriptor = {
          pathname: '/foo',
          search: '?bar=baz'
        }
        const location = createRouterLocation(descriptor, parse, stringify)
        expect(location).toIncludeKeys(['pathname', 'search', 'hash', 'query', 'state'])
      })

      describe('pathname', () => {
        it('is the provided pathname', () => {
          const descriptor = {
            pathname: '/foo'
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.pathname).toBe(descriptor.pathname)
        })

        it('is an empty string when there is no pathname', () => {
          const descriptor = {}
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.pathname).toBe('')
        })
      })

      describe('search', () => {
        it('is the provided search', () => {
          const descriptor = {
            search: '?bar=baz'
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.search).toBe(descriptor.search)
        })

        it('is the stringified query if there is no search', () => {
          const key = 'bar'
          const value = 'baz'
          const descriptor = {
            query: {
              [key]: value
            }
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.search).toBe(`?${key}=${value}`)
        })

        it('is an empty string if there is no search or query', () => {
          const descriptor = {}
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.search).toBe('')
        })
      })

      describe('hash', () => {
        it('is the provided hash', () => {
          const descriptor = {
            hash: '#quux'
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.hash).toBe(descriptor.hash)
        })

        it('is an empty string when there is no hash', () => {
          const descriptor = {}
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.hash).toBe('')
        })
      })

      describe('state', () => {
        it('is the provided state', () => {
          const descriptor = {
            state: {
              firstName: 'Bill',
              lastName: 'Nye'
            }
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.state).toEqual(descriptor.state)
        })

        it('is null when there is no state', () => {
          const descriptor = {}
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.state).toBe(null)
        })
      })

      describe('query', () => {
        it('is the provided query', () => {
          const descriptor = {
            query: {
              bar: 'baz'
            }
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.query).toEqual(descriptor.query)
        })

        it('is the parsed search when there is no query', () => {
          const key = 'bar'
          const value = 'baz'
          const descriptor = {
            search: `?${key}=${value}`
          }
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.query[key]).toBe(value)
        })

        it('is null if there is no query or search', () => {
          const descriptor = {}
          const location = createRouterLocation(descriptor, parse, stringify)
          expect(location.query).toBe(null)
        })
      })
    })
  })

  describe('createRouterPath', () => {
    describe('string', () => {
      it('returns the provided string', () => {
        const url = '/foo'
        const path = createRouterPath(url)
        expect(path).toBe(url)
      })
    })

    describe('object', () => {

      it('uses the properties of the object to construct a path', () => {
        const loc = {
          pathname: '/foo',
          search: '?bar=baz',
          hash: '#quux'
        }
        const path = createRouterPath(loc, stringify)
        expect(path).toBe(`${loc.pathname}${loc.search}${loc.hash}`)
      })

      describe('search', () => {
        it('creates path using provided search string', () => {
          const loc = {
            pathname: '/foo',
            search: '?bar=baz'
          }
          const path = createRouterPath(loc, stringify)
          expect(path).toBe(`${loc.pathname}${loc.search}`)  
        })

        it('creates path using query if there is no search', () => {
          const key = 'bar'
          const value = 'baz'
          const loc = {
            pathname: '/foo',
            query: {
              [key]: value
            }
          }
          const path = createRouterPath(loc, stringify)
          expect(path).toBe(`${loc.pathname}?${key}=${value}`)  
        })
      })
    })
  })

  describe('resolveLocation', () => {
    const BASE = '/a/b'

    describe('string location', () => {
      it('returns path if absolute', () => {
        const path = '/foo'
        expect(resolveLocation(path)).toBe(path)
      })
    })

    describe('object location', () => {
      it('does not affect the pathname if absolute', () => {
        const descriptor = { pathname: '/foo' }
        expect(resolveLocation(descriptor).pathname).toBe(descriptor.pathname)
      })

      describe('no pathname', () => {
        it('resolves to base if there is a query', () => {
          const descriptor = {
            query: {a: 'b'}
          }
          expect(resolveLocation(descriptor, BASE).pathname).toBe(BASE)
        })

        it('ignores empty query when determining if relative', () => {
          const descriptor = {
            query: {}
          }
          expect(resolveLocation(descriptor, BASE).pathname).toBe(undefined)
        })

        it('resolves to base if there is a query', () => {
          const descriptor = {
            search: '?a=b'
          }
          expect(resolveLocation(descriptor, BASE).pathname).toBe(BASE)
        })

        it('resolves to base if there is a hash', () => {
          const descriptor = {
            hash: '#foo'
          }
          expect(resolveLocation(descriptor, BASE).pathname).toBe(BASE)
        })
      })
    })

    it('removes unnecessary segments', () => {
      const input = 'foo//../bar'
      expect(resolveLocation(input, BASE)).toEqual('/a/b/bar')
    })

    describe('rfc1808', () => {

      // https://tools.ietf.org/html/rfc1808#section-5.1
      it('passes normal examples', () => {
        const cases = [
          { input: 'g', output: '/a/b/g' },
          { input: './g', output: '/a/b/g' },
          { input: 'g/', output: '/a/b/g/' },
          { input: '/g', output: '/g' },
          { input: '?y', output: '/a/b?y' },
          { input: 'g?y', output: '/a/b/g?y' },
          { input: 'g?y/./x', output: '/a/b/g?y/./x' },
          { input: '#s', output: '/a/b#s' },
          { input: 'g#s', output: '/a/b/g#s' },
          { input: 'g#s/./x', output: '/a/b/g#s/./x' },
          { input: 'g?y#s', output: '/a/b/g?y#s' },
          { input: '.', output: '/a/b' },
          { input: './', output: '/a/b/' },
          { input: '..', output: '/a' },
          { input: '../', output: '/a/' },
          { input: '../g', output: '/a/g' },
          { input: '../..', output: '' },
          { input: '../../', output: '/' },
          { input: '../../g', output: '/g' }
        ]
        cases.forEach(test => {
          expect(resolveLocation(test.input, BASE)).toBe(test.output)
        })
      })

      // https://tools.ietf.org/html/rfc1808#section-5.2
      it('passes abnormal examples', () => {
        const cases = [
          { input: '../../g', output: '/g' },
          { input: '../../../g', output: '/../g' },
          { input: '/./g', output: '/./g' },
          { input: '/../g', output: '/../g' },
          { input: 'g.', output: '/a/b/g.' },
          { input: '.g', output: '/a/b/.g' },
          { input: 'g..', output: '/a/b/g..' },
          { input: '..g', output: '/a/b/..g' },
          { input: './../g', output: '/a/g' },
          { input: './g/.', output: '/a/b/g' },
          { input: 'g/./h', output: '/a/b/g/h' },
          { input: 'g/../h', output: '/a/b/h' }
        ]
        cases.forEach(test => {
          expect(resolveLocation(test.input, BASE)).toBe(test.output)
        })
      })
    })
  })
})
