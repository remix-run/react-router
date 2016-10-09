// Simple cache - NEW cached items are added to cachedKeys array. When cache is
// full, oldest key is removed from array and item is removed from cache

const DEFAULT_OPTIONS = {
  limit: 200
}

export default class MatcherCache {
  cache = {}
  cachedKeys = []

  constructor(options = {}) {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    }
    this.options = mergedOptions
  }

  set(key, value) {
    // If this key is not cached add key to cachedKeys array
    if (this.cache[key] === undefined) {
      this.cachedKeys.push(key)
    }
    this.cache[key] = value
    this.checkCacheLimit()
  }

  get(key) {
    return this.cache[key]
  }

  checkCacheLimit() {
    // Clear a cache item if we are over limit
    if (this.cachedKeys.length > this.options.limit) {
      const keyToUncache = this.cachedKeys.shift()
      delete this.cache[keyToUncache]
    }
  }
}
