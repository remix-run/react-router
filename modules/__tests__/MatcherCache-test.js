import expect from 'expect'
import MatcherCache from '../MatcherCache'

describe('MatcherCache', () => {
  let cache

  beforeEach(() => {
    cache = new MatcherCache({ limit: 1 })
  })

  it('can set and get an item', () => {
    cache.set('/url', 1)
    expect(cache.get('/url')).toEqual(1)
  })

  it('removes cached item when limit is reached', () => {
    cache.set('/url-1', 1)
    cache.set('/url-2', 2)
    expect(cache.get('/url-1')).toEqual(undefined)
    expect(cache.get('/url-2')).toEqual(2)
  })

  it('should override currently cached items', () => {
    cache.set('/url-1', 1)
    cache.set('/url-1', 2)
    expect(cache.get('/url-1')).toEqual(2)
    expect(cache.cachedKeys.length).toEqual(1)
  })
})
