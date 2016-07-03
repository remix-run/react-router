import { loopAsync } from './AsyncUtils'
import { matchPattern } from './PatternUtils'
import warning from './routerWarning'
import { createRoutes } from './RouteUtils'

function getChildRoutes(route, location, paramNames, paramValues, callback) {
  if (route.childRoutes) {
    return [ null, route.childRoutes ]
  }
  if (!route.getChildRoutes) {
    return []
  }

  let sync = true, result

  const partialNextState = {
    location,
    params: createParams(paramNames, paramValues)
  }

  route.getChildRoutes(partialNextState, (error, childRoutes) => {
    childRoutes = !error && createRoutes(childRoutes)
    if (sync) {
      result = [ error, childRoutes ]
      return
    }

    callback(error, childRoutes)
  })

  sync = false
  return result  // Might be undefined.
}

function getIndexRoute(route, location, paramNames, paramValues, callback) {
  if (route.indexRoute) {
    callback(null, route.indexRoute)
  } else if (route.getIndexRoute) {
    const partialNextState = {
      location,
      params: createParams(paramNames, paramValues)
    }

    route.getIndexRoute(partialNextState, (error, indexRoute) => {
      callback(error, !error && createRoutes(indexRoute)[0])
    })
  } else if (route.childRoutes) {
    const pathless = route.childRoutes.filter(childRoute => !childRoute.path)

    loopAsync(pathless.length, function (index, next, done) {
      getIndexRoute(
        pathless[index], location, paramNames, paramValues,
        function (error, indexRoute) {
          if (error || indexRoute) {
            const routes = [ pathless[index] ].concat(
              Array.isArray(indexRoute) ? indexRoute : [ indexRoute ]
            )
            done(error, routes)
          } else {
            next()
          }
        }
      )
    }, function (err, routes) {
      callback(null, routes)
    })
  } else {
    callback()
  }
}

function assignParams(params, paramNames, paramValues) {
  return paramNames.reduce(function (params, paramName, index) {
    const paramValue = paramValues && paramValues[index]

    if (Array.isArray(params[paramName])) {
      params[paramName].push(paramValue)
    } else if (paramName in params) {
      params[paramName] = [ params[paramName], paramValue ]
    } else {
      params[paramName] = paramValue
    }

    return params
  }, params)
}

function createParams(paramNames, paramValues) {
  return assignParams({}, paramNames, paramValues)
}

function matchRouteDeep(
  route, location, remainingPathname, paramNames, paramValues, callback
) {
  let pattern = route.path || ''

  if (pattern.charAt(0) === '/') {
    remainingPathname = location.pathname
    paramNames = []
    paramValues = []
  }

  // Only try to match the path if the route actually has a pattern, and if
  // we're not just searching for potential nested absolute paths.
  if (remainingPathname !== null && pattern) {
    try {
      const matched = matchPattern(pattern, remainingPathname)
      if (matched) {
        remainingPathname = matched.remainingPathname
        paramNames = [ ...paramNames, ...matched.paramNames ]
        paramValues = [ ...paramValues, ...matched.paramValues ]
      } else {
        remainingPathname = null
      }
    } catch (error) {
      callback(error)
    }

    // By assumption, pattern is non-empty here, which is the prerequisite for
    // actually terminating a match.
    if (remainingPathname === '') {
      const match = {
        routes: [ route ],
        params: createParams(paramNames, paramValues)
      }

      getIndexRoute(
        route, location, paramNames, paramValues,
        function (error, indexRoute) {
          if (error) {
            callback(error)
          } else {
            if (Array.isArray(indexRoute)) {
              warning(
                indexRoute.every(route => !route.path),
                'Index routes should not have paths'
              )
              match.routes.push(...indexRoute)
            } else if (indexRoute) {
              warning(
                !indexRoute.path,
                'Index routes should not have paths'
              )
              match.routes.push(indexRoute)
            }

            callback(null, match)
          }
        }
      )

      return
    }
  }

  if (remainingPathname != null || route.childRoutes) {
    // Either a) this route matched at least some of the path or b)
    // we don't have to load this route's children asynchronously. In
    // either case continue checking for matches in the subtree.
    const onChildRoutes = (error, childRoutes) => {
      if (error) {
        callback(error)
      } else if (childRoutes) {
        // Check the child routes to see if any of them match.
        matchRoutes(childRoutes, location, function (error, match) {
          if (error) {
            callback(error)
          } else if (match) {
            // A child route matched! Augment the match and pass it up the stack.
            match.routes.unshift(route)
            callback(null, match)
          } else {
            callback()
          }
        }, remainingPathname, paramNames, paramValues)
      } else {
        callback()
      }
    }

    const result = getChildRoutes(
      route, location, paramNames, paramValues, onChildRoutes
    )
    if (result) {
      onChildRoutes(...result)
    }
  } else {
    callback()
  }
}

/**
 * Asynchronously matches the given location to a set of routes and calls
 * callback(error, state) when finished. The state object will have the
 * following properties:
 *
 * - routes       An array of routes that matched, in hierarchical order
 * - params       An object of URL parameters
 *
 * Note: This operation may finish synchronously if no routes have an
 * asynchronous getChildRoutes method.
 */
export default function matchRoutes(
  routes, location, callback,
  remainingPathname, paramNames=[], paramValues=[]
) {
  if (remainingPathname === undefined) {
    // TODO: This is a little bit ugly, but it works around a quirk in history
    // that strips the leading slash from pathnames when using basenames with
    // trailing slashes.
    if (location.pathname.charAt(0) !== '/') {
      location = {
        ...location,
        pathname: `/${location.pathname}`
      }
    }
    remainingPathname = location.pathname
  }

  loopAsync(routes.length, function (index, next, done) {
    matchRouteDeep(
      routes[index], location, remainingPathname, paramNames, paramValues,
      function (error, match) {
        if (error || match) {
          done(error, match)
        } else {
          next()
        }
      }
    )
  }, callback)
}
