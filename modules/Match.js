/* jshint -W084 */

var Path = require('./utils/Path');

class Match {

  constructor(pathname, params, query, routes) {
    this.pathname = pathname;
    this.params = params;
    this.query = query;
    this.routes = routes;
  }

}

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
  if (defaultRoute && (params = Path.extractParams(defaultRoute.path, pathname)))
    return new Match(pathname, params, query, [ route, defaultRoute ]);

  // Does the "not found" route match?
  var notFoundRoute = route.notFoundRoute;
  if (notFoundRoute && (params = Path.extractParams(notFoundRoute.path, pathname)))
    return new Match(pathname, params, query, [ route, notFoundRoute ]);

  // Last attempt: check this route.
  var params = Path.extractParams(route.path, pathname);
  if (params)
    return new Match(pathname, params, query, [ route ]);

  return null;
}

/**
 * Attempts to match depth-first a route in the given route's
 * subtree against the given path and returns the match if it
 * succeeds, null if no match can be made.
 */
Match.findMatchForPath = function (routes, path) {
  var pathname = Path.withoutQuery(path);
  var query = Path.extractQuery(path);
  var match = null;

  for (var i = 0, len = routes.length; match == null && i < len; ++i)
    match = deepSearch(routes[i], pathname, query);

  return match;
};

module.exports = Match;
