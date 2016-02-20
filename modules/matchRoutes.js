import warning from './routerWarning'
import { loopAsync } from './AsyncUtils'
import { makeParams, matchPattern } from './PatternUtils'
import { createRoutes } from './RouteUtils'

function getChildRoutes(route, location, callback) {
  if (route.childRoutes) {
    return [ null, route.childRoutes ]
  }
  if (!route.getChildRoutes) {
    return []
  }

  let sync = true, result

  route.getChildRoutes(location, function (error, childRoutes) {
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

function matchRouteDeep(
  route, location, remainingPathname, paramNames, paramValues, callback
) {
  let pattern = route.path || ''

  if (pattern.charAt(0) === '/') {
    remainingPathname = location.pathname
    paramNames = []
    paramValues = []
  }

  if (remainingPathname != null) {
    const matched = matchPattern(pattern, remainingPathname)

    remainingPathname = matched.remainingPathname
    paramNames = [ ...paramNames, ...matched.paramNames ]
    paramValues = [ ...paramValues, ...matched.paramValues ]
  }

  if (remainingPathname == null && !route.childRoutes) {
    // If the route didn't match the path and we don't have synchronous
    // children, then bail; with synchronous children, we might have a nested
    // absolute match.
    callback()
    return
  }

  if (remainingPathname === '' && route.path) {
    // We have an exact match.
    const match = {
      routes: [ route ],
      params: makeParams(paramNames, paramValues)
    }

    getIndexRoute(route, location, function (error, indexRoute) {
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
    })

    return
  }

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

  const result = getChildRoutes(route, location, onChildRoutes)
  if (result) {
    onChildRoutes(...result)
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
