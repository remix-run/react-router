import pathToRegexp from 'path-to-regexp'

const RegexpCache = {}
const CompiledCache = {}

function getRegexp(pattern) {
  if (!RegexpCache[pattern]) {
    RegexpCache[pattern] = pathToRegexp(pattern, { end: false })
  }

  return RegexpCache[pattern]
}

function getCompiled(pattern) {
  if (!CompiledCache[pattern]) {
    CompiledCache[pattern] = pathToRegexp.compile(pattern)
  }

  return CompiledCache[pattern]
}

/**
 * Attempts to match a pattern on the given pathname.
 *
 * The return value is an object with the following properties:
 *
 * - remainingPathname
 * - paramNames
 * - paramValues
 */
export function matchPattern(pattern, pathname) {
  // Make leading slashes consistent between pattern and pathname.
  if (pattern.charAt(0) !== '/') {
    pattern = `/${pattern}`
  }
  if (pathname.charAt(0) !== '/') {
    pathname = `/${pathname}`
  }

  const regexp = getRegexp(pattern)
  const match = regexp.exec(pathname)

  if (match == null) {
    return {
      remainingPathname: null,
      paramNames: [],
      paramValues: []
    }
  }

  return {
    remainingPathname: pathname.substr(match[0].length),
    paramNames: regexp.keys.map(({ name }) => name),
    paramValues: match.slice(1).map(v => v && decodeURIComponent(v))
  }
}

export function getParamNames(pattern) {
  // By assumption we'll have already built the regexp, so better to use the
  // cached regexp than to use pathToRegexp.parse.
  return getRegexp(pattern).keys.map(({ name }) => name)
}

export function makeParams(paramNames, paramValues) {
  const params = {}
  let lastIndex = 0

  paramNames.forEach((paramName, index) => {
    if (typeof paramName === 'number') {
      paramName = lastIndex++
    }

    params[paramName] = paramValues && paramValues[index]
  })

  return params
}

export function getParams(pattern, pathname) {
  const { remainingPathname, paramNames, paramValues } =
    matchPattern(pattern, pathname)

  if (remainingPathname == null) {
    return null
  }

  return makeParams(paramNames, paramValues)
}

/**
 * Returns a version of the given pattern with params interpolated. Throws
 * if there is a dynamic segment of the pattern for which there is no param.
 */
export function formatPattern(pattern, params) {
  return getCompiled(pattern)(params)
}
