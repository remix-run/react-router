import { loopAsync } from './AsyncUtils';
import { createRoutes } from './RouteUtils';
import { getPathname, getQueryString, matchPattern, stripLeadingSlashes } from './PathUtils';
import Location from './Location';

function getChildRoutes(route, callback) {
  if (route.childRoutes) {
    callback(null, route.childRoutes);
  } else if (route.getChildRoutes) {
    route.getChildRoutes(callback);
  } else {
    callback();
  }
}

function assignParams(params, paramNames, paramValues) {
  return paramNames.reduceRight(function (params, paramName, index) {
    var paramValue = paramValues[index];

    if (Array.isArray(params[paramName])) {
      params[paramName].unshift(paramValue);
    } else if (paramName in params) {
      params[paramName] = [ paramValue, params[paramName] ];
    } else {
      params[paramName] = paramValue;
    }

    return params;
  }, params);
}

function createParams(paramNames, paramValues) {
  return assignParams({}, paramNames, paramValues);
}

function matchRouteDeep(route, pathname, callback) {
  var { remainingPathname, paramNames, paramValues } = matchPattern(route.path, pathname);
  var isExactMatch = remainingPathname === '';

  if (isExactMatch) {
    var params = createParams(paramNames, paramValues);
    var branch = [ route ];

    if (route.indexRoute) {
      branch.push(route.indexRoute);
      callback(null, { params, branch });
    } else if (route.getIndexRoute) {
      route.getIndexRoute(function (error, indexRoute) {
        if (error) {
          callback(error);
        } else {
          branch.push(indexRoute);
          callback(null, { params, branch });
        }
      });
    } else {
      callback(null, { params, branch });
    }
  } else if (remainingPathname != null) {
    // This route matched at least some of the path.
    getChildRoutes(route, function (error, childRoutes) {
      if (error) {
        callback(error);
      } else if (childRoutes) {
        // Check the child routes to see if any of them match.
        matchRoutes(childRoutes, remainingPathname, function (error, match) {
          if (error) {
            callback(error);
          } else if (match) {
            // A child route matched! Augment the match and pass it up the stack.
            assignParams(match.params, paramNames, paramValues);
            match.branch.unshift(route);
            callback(null, match);
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

function matchRoutes(routes, pathname, callback) {
  routes = createRoutes(routes);

  loopAsync(routes.length, function (index, next, done) {
    matchRouteDeep(routes[index], pathname, function (error, match) {
      if (error || match) {
        done(error, match);
      } else {
        next();
      }
    });
  }, callback);
}

/**
 * Asynchronously matches the given location to a set of routes and calls
 * callback(error, state) when finished. The state object may have the
 * following properties:
 *
 * - location     The Location object
 * - branch       An array of routes that matched, in hierarchical order
 * - params       An object of URL parameters
 *
 * Note: This operation may return synchronously if no routes have an
 * asynchronous getChildRoutes method.
 */
export function getProps(routes, location, parseQueryString, callback) {
  if (!Location.isLocation(location))
    location = Location.create(location); // Allow location-like objects.

  var pathname = stripLeadingSlashes(getPathname(location.path));

  matchRoutes(routes, pathname, function (error, props) {
    if (error || props == null) {
      callback(error);
    } else {
      props.location = location;
      props.query = parseQueryString(getQueryString(location.path));
      callback(null, props);
    }
  });
}
