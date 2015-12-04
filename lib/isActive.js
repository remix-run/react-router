'use strict';

exports.__esModule = true;

var _PatternUtils = require('./PatternUtils');

function deepEqual(a, b) {
  if (a == b) return true;

  if (a == null || b == null) return false;

  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every(function (item, index) {
      return deepEqual(item, b[index]);
    });
  }

  if (typeof a === 'object') {
    for (var p in a) {
      if (!a.hasOwnProperty(p)) {
        continue;
      }

      if (a[p] === undefined) {
        if (b[p] !== undefined) {
          return false;
        }
      } else if (!b.hasOwnProperty(p)) {
        return false;
      } else if (!deepEqual(a[p], b[p])) {
        return false;
      }
    }

    return true;
  }

  return String(a) === String(b);
}

function paramsAreActive(paramNames, paramValues, activeParams) {
  // FIXME: This doesn't work on repeated params in activeParams.
  return paramNames.every(function (paramName, index) {
    return String(paramValues[index]) === String(activeParams[paramName]);
  });
}

function getMatchingRouteIndex(pathname, activeRoutes, activeParams) {
  var remainingPathname = pathname,
      paramNames = [],
      paramValues = [];

  for (var i = 0, len = activeRoutes.length; i < len; ++i) {
    var route = activeRoutes[i];
    var pattern = route.path || '';

    if (pattern.charAt(0) === '/') {
      remainingPathname = pathname;
      paramNames = [];
      paramValues = [];
    }

    if (remainingPathname !== null) {
      var matched = _PatternUtils.matchPattern(pattern, remainingPathname);
      remainingPathname = matched.remainingPathname;
      paramNames = [].concat(paramNames, matched.paramNames);
      paramValues = [].concat(paramValues, matched.paramValues);
    }

    if (remainingPathname === '' && route.path && paramsAreActive(paramNames, paramValues, activeParams)) return i;
  }

  return null;
}

/**
 * Returns true if the given pathname matches the active routes
 * and params.
 */
function routeIsActive(pathname, routes, params, indexOnly) {
  var i = getMatchingRouteIndex(pathname, routes, params);

  if (i === null) {
    // No match.
    return false;
  } else if (!indexOnly) {
    // Any match is good enough.
    return true;
  }

  // If any remaining routes past the match index have paths, then we can't
  // be on the index route.
  return routes.slice(i + 1).every(function (route) {
    return !route.path;
  });
}

/**
 * Returns true if all key/value pairs in the given query are
 * currently active.
 */
function queryIsActive(query, activeQuery) {
  if (activeQuery == null) return query == null;

  if (query == null) return true;

  return deepEqual(query, activeQuery);
}

/**
 * Returns true if a <Link> to the given pathname/query combination is
 * currently active.
 */
function isActive(pathname, query, indexOnly, location, routes, params) {
  if (location == null) return false;

  if (!routeIsActive(pathname, routes, params, indexOnly)) return false;

  return queryIsActive(query, location.query);
}

exports['default'] = isActive;
module.exports = exports['default'];