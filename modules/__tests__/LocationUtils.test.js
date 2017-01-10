import expect from 'expect'
import { parse, stringify } from 'query-string'
import { createRouterLocation, createRouterPath } from '../LocationUtils'

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
})
