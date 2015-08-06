import { matchPattern } from './PatternUtils';

/**
 * Returns true if a route and params that match the given
 * pathname are currently active.
 */
function pathnameIsActive(pathname, activePathname, activeRoutes, activeParams) {
  if (pathname === activePathname || activePathname.indexOf(pathname + '/') === 0)
    return true;

  var route, pattern, basename;
  for (var i = 0, len = activeRoutes.length; i < len; ++i) {
    route = activeRoutes[i];
    pattern = route.path || '';

    if (pattern.indexOf('/') !== 0)
      pattern = basename.replace(/\/*$/, '/') + pattern; // Relative paths build on the parent's path.

    var { remainingPathname, paramNames, paramValues } = matchPattern(pattern, pathname);

    if (remainingPathname === '') {
      return paramNames.every(function (paramName, index) {
        return String(paramValues[index]) === String(activeParams[paramName]);
      });
    }

    basename = pattern;
  }

  return false;
}

/**
 * Returns true if all key/value pairs in the given query are
 * currently active.
 */
function queryIsActive(query, activeQuery) {
  if (activeQuery == null)
    return query == null;

  if (query == null)
    return true;

  for (var p in query)
    if (query.hasOwnProperty(p) && String(query[p]) !== String(activeQuery[p]))
      return false;

  return true;
}

var ActiveMixin = {

  /**
   * Returns true if a <Link> to the given pathname/query combination is
   * currently active.
   */
  isActive(pathname, query) {
    var { location, routes, params } = this.state;

    if (location == null)
      return false;

    return pathnameIsActive(pathname, location.pathname, routes, params) &&
      queryIsActive(query, location.query);
  }

};

export default ActiveMixin;
