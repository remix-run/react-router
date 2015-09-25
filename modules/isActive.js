import { matchPattern } from './PatternUtils'

/**
 * Returns true if the given pathname matches the active pathname.
 */
function pathnameIsActive(pathname, activePathname) {
  return pathname === activePathname || activePathname.indexOf(pathname + '/') === 0
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

    //if (!route.path)
    //  return false

    pattern = route.path || ''

    if (pattern.charAt(0) !== '/')
      pattern = basename.replace(/\/*$/, '/') + pattern // Relative paths build on the parent's path.

    let { remainingPathname, paramNames, paramValues } = matchPattern(pattern, pathname)

    if (remainingPathname === '' && paramsAreActive(paramNames, paramValues, activeParams))
      return route

    basename = pattern
  }

  return null
}

/**
 * Returns true if the given pathname matches the active routes
 * and params.
 */
function routeIsActive(pathname, activeRoutes, activeParams, indexOnly) {
  let route = getMatchingRoute(pathname, activeRoutes, activeParams)

  if (route == null)
    return false

  if (indexOnly)
    return activeRoutes.length > 1 && activeRoutes[activeRoutes.length - 2].indexRoute === route

  return true
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

  for (const p in query)
    if (query.hasOwnProperty(p) && String(query[p]) !== String(activeQuery[p]))
      return false

  return true
}

/**
 * Returns true if a <Link> to the given pathname/query combination is
 * currently active.
 */
function isActive(pathname, query, indexOnly, location, routes, params) {
  if (location == null)
    return false

  if (!pathnameIsActive(pathname, location.pathname) && !routeIsActive(pathname, routes, params, indexOnly))
    return false

  return queryIsActive(query, location.query)
}

export default isActive
