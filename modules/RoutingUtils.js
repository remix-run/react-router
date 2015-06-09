import { createRoutes } from './RouteUtils';
import { getParamNames, getPathname, getQueryString, matchPattern, stripLeadingSlashes } from './URLUtils';
import { loopAsync, mapAsync } from './AsyncUtils';
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

function getIndexRoute(route, callback) {
  if (route.indexRoute) {
    callback(null, route.indexRoute);
  } else if (route.getIndexRoute) {
    route.getIndexRoute(callback);
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

    getIndexRoute(route, function (error, indexRoute) {
      if (error) {
        callback(error);
      } else {
        if (indexRoute)
          branch.push(indexRoute);

        callback(null, { params, branch });
      }
    });
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
 * - branch       An array of routes that matched, in hierarchical order
 * - params       An object of URL parameters
 * - query        An object of data contained in the URL query string
 *
 * Note: This operation may return synchronously if no routes have an
 * asynchronous getChildRoutes method.
 */
export function getProps(routes, location, parseQueryString, callback) {
  var pathname = stripLeadingSlashes(getPathname(location.path));

  matchRoutes(routes, pathname, function (error, props) {
    if (error || props == null) {
      callback(error);
    } else {
      props.query = parseQueryString(getQueryString(location.path));
      callback(null, props);
    }
  });
}

function routeParamsChanged(route, prevState, nextState) {
  if (!route.path)
    return false;

  var paramNames = getParamNames(route.path);

  return paramNames.some(function (paramName) {
    return prevState.params[paramName] !== nextState.params[paramName];
  });
}

/**
 * Runs a diff on the two router states and returns an array of two
 * arrays: 1) the routes that we are leaving, starting with the leaf
 * route and 2) the routes that we are entering, ending with the leaf
 * route.
 */
export function computeDiff(prevState, nextState) {
  var fromRoutes = prevState && prevState.branch;
  var toRoutes = nextState.branch;

  var leavingRoutes, enteringRoutes;
  if (fromRoutes) {
    leavingRoutes = fromRoutes.filter(function (route) {
      return toRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
    });

    // onLeave hooks start at the leaf route.
    leavingRoutes.reverse();

    enteringRoutes = toRoutes.filter(function (route) {
      return fromRoutes.indexOf(route) === -1 || leavingRoutes.indexOf(route) !== -1;
    });
  } else {
    leavingRoutes = [];
    enteringRoutes = toRoutes;
  }

  return [
    leavingRoutes,
    enteringRoutes
  ];
}

export function createTransitionHook(fn, context) {
  return function (nextState, router, callback) {
    if (fn.length > 2) {
      fn.call(context, nextState, router, callback);
    } else {
      // Assume fn executes synchronously and
      // automatically call the callback for them.
      fn.call(context, nextState, router);
      callback();
    }
  };
}

function getTransitionHooksFromRoutes(routes, hookName) {
  return routes.reduce(function (hooks, route) {
    if (route[hookName])
      hooks.push(createTransitionHook(route[hookName], route));

    return hooks;
  }, []);
}

/**
 * Compiles and returns an array of transition hook functions that
 * should be called before we transition to a new state. Transition
 * hook signatures are:
 *
 *   - route.onLeave(nextState, router[, callback ])
 *   - route.onEnter(nextState, router[, callback ])
 *
 * Transition hooks run in order from the leaf route in the branch
 * we're leaving, up the tree to the common parent route, and back
 * down the branch we're entering to the leaf route.
 *
 * If a transition hook needs to execute asynchronously it may have
 * a 3rd argument that it should call when it is finished. Otherwise
 * the transition executes synchronously.
 */
export function getTransitionHooks(prevState, nextState) {
  var [ leavingRoutes, enteringRoutes ] = computeDiff(prevState, nextState);
  var hooks = getTransitionHooksFromRoutes(leavingRoutes, 'onLeave');

  hooks.push.apply(
    hooks,
    getTransitionHooksFromRoutes(enteringRoutes, 'onEnter')
  );

  return hooks;
}

function getComponentsForRoute(route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
  } else if (route.getComponents) {
    route.getComponents(callback);
  } else {
    callback();
  }
}

function getComponentsForRoutes(routes, callback) {
  mapAsync(routes, function (route, index, callback) {
    getComponentsForRoute(route, callback);
  }, callback);
}

/**
 * Asynchronously fetches all components needed for the given router
 * state and calls callback(error, components) when finished.
 *
 * Note: This operation may return synchronously if no routes have an
 * asynchronous getComponents method.
 */
export function getComponents(props, callback) {
  getComponentsForRoutes(props.branch, callback);
}

/**
 * Assigns the result of getComponents to props.components.
 */
export function getAndAssignComponents(props, callback) {
  getComponents(props, function (error, components) {
    if (!error)
      props.components = components;

    callback(error);
  });
}

/**
 * Returns true if the given pathname matches against the routes
 * in the given branch.
 */
export function branchMatches(branch, pathname) {
  for (var i = 0, len = branch.length; i < len; ++i) {
    pathname = matchPattern(branch[i].path, pathname).remainingPathname;

    if (pathname === '')
      return true;
  }

  return false;
}

export function makePath(pathname, query, stringifyQuery) {
  if (query) {
    if (typeof query !== 'string')
      query = stringifyQuery(query);
    if (query !== '')
      return pathname + '?' + query;
  }
  return pathname;
}

export function makeHref(pathname, query, stringifyQuery, history) {
  var path = makePath(pathname, query, stringifyQuery);
  if (history && history.makeHref)
    return history.makeHref(path);
  return path;
}

