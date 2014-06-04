var invariant = require('react/lib/invariant');

/**
 * A hash of <Route>s keyed by route name.
 */
var _routes = {};

/**
 * Adds the given <Route> to the store.
 */
exports.addRoute = addRoute;
function addRoute(route) {
  var routeName = route.props.name;

  if (routeName) {
    invariant(
      !_routes[routeName],
      'You cannot use the name "' + routeName + '" for more than one route'
    );

    _routes[routeName] = route;
  }
}

/**
 * Gets the <Route> with the given name.
 */
exports.getRouteByName = getRouteByName;
function getRouteByName(routeName) {
  return _routes[routeName];
}
