import { getParamNames } from './PatternUtils'

/**
 * Extracts an object of params the given route cares about from
 * the given params object.
 */
function getRouteParams(route, params) {
  const routeParams = {}

  if (!route.path)
    return routeParams

  const paramNames = getParamNames(route.path)

  for (const p in params) {
    if (
      Object.prototype.hasOwnProperty.call(params, p) &&
      paramNames.indexOf(p) !== -1
    ) {
      routeParams[p] = params[p]
    }
  }

  return routeParams
}

export default getRouteParams
