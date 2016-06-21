import pathToRegexp from 'path-to-regexp'

const cache = {}

const getMatcher = (pattern) => {
  let matcher = cache[pattern]

  if (!matcher) {
    const keys = []
    const regex = pathToRegexp(pattern, keys)
    matcher = cache[pattern] = { keys, regex }
  }

  return matcher
}

const truncatePathnameToPattern = (pathname, pattern) =>
  pathname.split('/').slice(0, pattern.split('/').length).join('/')

const parseParams = (pattern, match, keys) =>
  match.slice(1).reduce((params, value, index) => {
    params[keys[index].name] = value
    return params
  }, {})

const matchPattern = (pattern, locPathname, matchExactly) => {
  const specialCase = !matchExactly && pattern === '/'

  if (specialCase) {
    return {
      params: null,
      isTerminal: locPathname === '/',
      pathname: '/'
    }
  } else {
    const matcher = getMatcher(pattern)
    const pathname = matchExactly ?
      locPathname : truncatePathnameToPattern(locPathname, pattern)
    const match = matcher.regex.exec(pathname)

    if (match) {
      const params = parseParams(pattern, match, matcher.keys)
      const locationLength = locPathname.split('/').length
      const patternLength = pattern.split('/').length
      const isTerminal = locationLength === patternLength
      return { params, isTerminal, pathname }
    } else {
      return null
    }
  }
}

export default matchPattern
