import pathToRegexp from 'path-to-regexp'

// cache[exactly][pattern] contains getMatcher(pattern, exactly)
const cache = {true: {}, false: {}}

const getMatcher = (pattern, exactly) => {
  const exactlyStr = exactly ? 'true' : 'false'
  let matcher = cache[exactlyStr][pattern]

  if (!matcher) {
    const keys = []
    const regex = pathToRegexp(pattern, keys, { end: exactly, strict: true })
    matcher = cache[exactlyStr][pattern] = { keys, regex }
  }

  return matcher
}

const parseParams = (pattern, match, keys) =>
  match.slice(1).reduce((params, value, index) => {
    params[keys[index].name] = decodeURIComponent(value)
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
    if (parent && pattern.charAt(0) !== '/') {
      pattern = parent.pathname +
        (parent.pathname.charAt(parent.pathname.length - 1) !== '/' ? '/' : '') +
        pattern
    }

    const matcher = getMatcher(pattern, matchExactly)
    const match = matcher.regex.exec(location.pathname)

    if (match) {
      const params = parseParams(pattern, match, matcher.keys)
      const pathname = match[0]
      const isExact = pathname === location.pathname

      return { params, isExact, pathname }
    } else {
      return null
    }
  }
}

export default matchPattern
