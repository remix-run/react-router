import pathToRegexp from 'path-to-regexp'

const patternCache = Object.create(null)

const compilePattern = (pattern) => {
  if (!patternCache[pattern]) {
    const keys = []
    const re = pathToRegexp(pattern, keys)
    patternCache[pattern] = { re, keys }
  }

  return patternCache[pattern]
}

const matchPattern = (pattern, exact, pathname) => {
  if (!pattern)
    return { pathname, isExact: true, params: {} }

  const { re, keys } = compilePattern(pattern)
  const match = re.exec(pathname)

  if (!match)
    return null

  const [ path, ...values ] = match
  const isExact = pathname === path

  if (exact && !isExact)
    return null

  return {
    isExact,
    pathname: path,
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index]
      return memo
    }, {})
  }
}

export default matchPattern
