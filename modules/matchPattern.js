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

const truncatePathnameToPattern = (pathname, pattern) => {
  const patternSegments = pattern.split('/')
  const pathnameSegments = pathname.split('/').slice(0, patternSegments.length)
  // If pattern ends with a trailing slash, keep the corresponding slash in
  // pathname but not the following segment.
  if (patternSegments[patternSegments.length - 1] == ''
      && pathnameSegments.length == patternSegments.length)
    pathnameSegments[pathnameSegments.length - 1] = ''
  return pathnameSegments.join('/')
}

const parseParams = (pattern, match, keys) =>
  match.slice(1).reduce((params, value, index) => {
    params[keys[index].name] = value
    return params
  }, {})

const matchPattern = (pattern, location, matchExactly, parent) => {
  const specialCase = !matchExactly && pattern === '/'

  if (specialCase) {
    return {
      params: null,
      isExact: location.pathname === '/',
      pathname: '/'
    }
  } else {
    if (!matchExactly && parent && pattern.charAt(0) !== '/') {
      pattern = parent.pathname +
        (parent.pathname.charAt(parent.pathname.length - 1) !== '/' ? '/' : '') +
        pattern
    }

    const matcher = getMatcher(pattern)
    const pathname = matchExactly ?
      location.pathname : truncatePathnameToPattern(location.pathname, pattern)
    const match = matcher.regex.exec(pathname)

    if (match) {
      const params = parseParams(pattern, match, matcher.keys)
      const locationLength = location.pathname.split('/').length
      const patternLength = pattern.split('/').length
      const isExact = locationLength === patternLength
      return { params, isExact, pathname }
    } else {
      return null
    }
  }
}

export default matchPattern
