import { matchPattern } from './PatternUtils'

function deepEqual(a, b) {
  if (a == b)
    return true

  if (a == null || b == null)
    return false

  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every(function (item, index) {
      return deepEqual(item, b[index])
    })
  }

  if (typeof a === 'object') {
    for (let p in a) {
      if (!a.hasOwnProperty(p)) {
        continue
      }

      if (a[p] === undefined) {
        if (b[p] !== undefined) {
          return false
        }
      } else if (!b.hasOwnProperty(p)) {
        return false
      } else if (!deepEqual(a[p], b[p])) {
        return false
      }
    }

    return true
  }

  return String(a) === String(b)
}

function paramsAreActive(paramNames, paramValues, activeParams) {
  return paramNames.every(function (paramName, index) {
    return String(paramValues[index]) === String(activeParams[paramName])
  })
}

function getMatchingRoute(pathname, activeRoutes, activeParams) {
  let route, pattern, basename = ''
  for (let i = 0, len = activeRoutes.length; i < len; ++i) {
    route = activeRoutes[i]
    pattern = route.path || ''

    if (pattern.charAt(0) !== '/')
      pattern = basename.replace(/\/*$/, '/') + pattern // Relative paths build on the parent's path.

    let { remainingPathname, paramNames, paramValues } = matchPattern(pattern, pathname)

    if (remainingPathname === '' && route.path && paramsAreActive(paramNames, paramValues, activeParams))
      return route

    basename = pattern
  }

  return null
}

/**
 * Returns true if the given pathname matches the active routes
 * and params.
 */
function routeIsActive(pathname, location, routes, params, indexOnly) {
  if (indexOnly) {
    return location.pathname.replace(/\/*$/) === pathname.replace(/\/*$/)
  }

  return getMatchingRoute(pathname, routes, params) != null
}

/**
 * Returns true if all key/value pairs in the given query are
 * currently active.
 */
function queryIsActive(query, activeQuery) {
  if (activeQuery == null)
    return query == null

  if (query == null)
    return true

  return deepEqual(query, activeQuery)
}

/**
 * Returns true if a <Link> to the given pathname/query combination is
 * currently active.
 */
function isActive(pathname, query, indexOnly, location, routes, params) {
  if (location == null)
    return false

  if (!routeIsActive(pathname, location, routes, params, indexOnly))
    return false

  return queryIsActive(query, location.query)
}

export default isActive
