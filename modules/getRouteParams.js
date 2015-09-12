import { getParamNames } from './PatternUtils'

/**
 * Extracts an object of params the given route cares about from
 * the given params object.
 */
function getRouteParams(route, params) {
  var routeParams = {}

  if (!route.path)
    return routeParams

  var paramNames = getParamNames(route.path)

  for (var p in params)
    if (params.hasOwnProperty(p) && paramNames.indexOf(p) !== -1)
      routeParams[p] = params[p]

  return routeParams
}

export default getRouteParams
