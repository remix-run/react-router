import warning from './routerWarning'
import { loopAsync } from './AsyncUtils'
import { matchPattern } from './PatternUtils'
import { createRoutes } from './RouteUtils'

function getChildRoutes(route, location, callback) {
  if (route.childRoutes) {
    return callback(null, route.childRoutes)
  }
  if (!route.getChildRoutes) {
    return callback(null, [])
  }

  route.getChildRoutes(location, function (error, childRoutes) {
    if (error) {
      callback(error)
    } else {
      callback(null, createRoutes(childRoutes))
    }
  })
}

function getIndexRoute(route, location, callback) {
  if (route.indexRoute) {
    callback(null, route.indexRoute)
  } else if (route.getIndexRoute) {
    route.getIndexRoute(location, function (error, indexRoute) {
      callback(error, !error && createRoutes(indexRoute)[0])
    })
  } else if (route.childRoutes) {
    const pathless = route.childRoutes.filter(function (obj) {
      return !obj.hasOwnProperty('path')
    })

    loopAsync(pathless.length, function (index, next, done) {
      getIndexRoute(pathless[index], location, function (error, indexRoute) {
        if (error || indexRoute) {
          const routes = [ pathless[index] ].concat( Array.isArray(indexRoute) ? indexRoute : [ indexRoute ] )
          done(error, routes)
        } else {
          next()
        }
      })
    }, function (err, routes) {
      callback(null, routes)
    })
  } else {
    callback()
  }
}

function checkCondition(condition, params, callback) {
  if (!condition) {
    callback(null, true)
  } else {
    condition(params, callback)
  }
}

function finalize(route, location, paramNames, paramValues, callback) {
  const params = createParams(paramNames, paramValues)

  checkCondition(route.condition, params, function (error, isMatch) {
    if (error) {
      callback(error)
    } else if (!isMatch) {
      callback()
    } else {
      getIndexRoute(route, location, function (error, indexRoute) {
        if (error) {
          callback(error)
        } else {
          const match = {
            routes: [ route ],
            params: params
          }

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
      })
    }
  })
}

function matchChildren(route, location, remainingPathname, paramNames, paramValues, callback) {
  checkCondition(route.condition, createParams(paramNames, paramValues), function (error, isMatch) {
    if (error) {
      callback(error)
    } else if (!isMatch) {
      callback()
    } else {
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

      getChildRoutes(route, location, onChildRoutes)
    }
  })
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

  if (remainingPathname !== null) {
    const matched = matchPattern(pattern, remainingPathname)
    remainingPathname = matched.remainingPathname
    paramNames = [ ...paramNames, ...matched.paramNames ]
    paramValues = [ ...paramValues, ...matched.paramValues ]

    if (remainingPathname === '' && route.path) {
      return finalize(route, location, paramNames, paramValues, callback)
    }
  }

  if (remainingPathname !== null || route.childRoutes) {
    return matchChildren(route, location, remainingPathname, paramNames, paramValues, callback)
  }

  callback()
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
function matchRoutes(
  routes, location, callback,
  remainingPathname=location.pathname, paramNames=[], paramValues=[]
) {
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

export default matchRoutes
