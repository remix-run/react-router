/* jshint -W084 */
var PathUtils = require('./PathUtils');

function deepSearch(route, pathname, query) {
  // Check the subtree first to find the most deeply-nested match.
  var childRoutes = route.childRoutes;
  if (childRoutes) {
    var match, childRoute;
    for (var i = 0, len = childRoutes.length; i < len; ++i) {
      childRoute = childRoutes[i];

      if (childRoute.isDefault || childRoute.isNotFound)
        continue; // Check these in order later.

      if (match = deepSearch(childRoute, pathname, query)) {
        // A route in the subtree matched! Add this route and we're done.
        match.routes.unshift(route);
        return match;
      }
    }
  }

  // No child routes matched; try the default route.
  var defaultRoute = route.defaultRoute;
  if (defaultRoute && (params = PathUtils.extractParams(defaultRoute.path, pathname)))
    return new Match(pathname, params, query, [ route, defaultRoute ]);

  // Does the "not found" route match?
  var notFoundRoute = route.notFoundRoute;
  if (notFoundRoute && (params = PathUtils.extractParams(notFoundRoute.path, pathname)))
    return new Match(pathname, params, query, [ route, notFoundRoute ]);

  // Last attempt: check this route.
  var params = PathUtils.extractParams(route.path, pathname);
  if (params)
    return new Match(pathname, params, query, [ route ]);

  return null;
}

class Match {

  /**
   * Attempts to match depth-first a route in the given route's
   * subtree against the given path and returns the match if it
   * succeeds, null if no match can be made.
   */
  static findMatch(routes, path) {
    var pathname = PathUtils.withoutQuery(path);
    var query = PathUtils.extractQuery(path);
    var match = null;

    for (var i = 0, len = routes.length; match == null && i < len; ++i)
      match = deepSearch(routes[i], pathname, query);

    return match;
  }

  constructor(pathname, params, query, routes) {
    this.pathname = pathname;
    this.params = params;
    this.query = query;
    this.routes = routes;
  }

}

module.exports = Match;
