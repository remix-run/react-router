import pathToRegexp from 'path-to-regexp'
import { simpleResolve } from './resolve'

const patternCache = {}
const cacheLimit = 10000
let cacheCount = 0

const compilePath = (pattern, options) => {
  const cacheKey = options.end + options.strict
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {})

  if (cache[pattern])
    return cache[pattern]

  const keys = []
  const re = pathToRegexp(pattern, keys, options)
  const compiledPattern = { re, keys }

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern
    cacheCount++
  }

  return compiledPattern
}

/**
 * Public API for matching a URL pathname to a path pattern.
 */
const matchPath = (pathname, path, options = {}, parent = null) => {
  const { exact = false, strict = false } = options

  if (!path)
    return { url: parent ? parent.url : '/', isExact: true, params: {} }

  path = simpleResolve(path, parent && parent.url ? parent.url : '')

  const { re, keys } = compilePath(path, { end: exact, strict })
  const match = re.exec(pathname)

  if (!match)
    return null

  const [ url, ...values ] = match
  const isExact = pathname === url

  if (exact && !isExact)
    return null

  const params = Object.assign({},
    parent && parent.params,
    keys.reduce((memo, key, index) => {
      memo[key.name] = values[index]
      return memo
    }, {})
  )

  return {
    path, // the path pattern used to match
    url: path === '/' && url === '' ? '/' : url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
    params
  }
}

export default matchPath
