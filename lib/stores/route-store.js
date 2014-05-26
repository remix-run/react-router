var React = require('react');
var path = require('../path');
var qs = require('querystring');

/**
 * A hash of routes keyed by route name.
 */
var _namedRoutes = {};

/**
 * The root route so we can link to '/'
*/
var _root;

/**
 * Gets the <Route> with the given name.
 */
exports.getRouteByName = getRouteByName;
function getRouteByName(routeName) {
  if (routeName === '/') return _root;
  return _namedRoutes[routeName];
}

/**
 * Makes a URL path for the route with the given name, interpolated
 * with the given params.
 */
exports.makePathForRouteName = makePathForRouteName;
function makePathForRouteName(routeName, params) {
  var route = getRouteByName(routeName);

  if (!route)
    throw new Error('No route with name: ' + routeName);

  return path.injectParams(computeRoutePath(route), params);
}

var _routeTree = [];

/**
 * Recursively stores all <Route>s under the given <Routes> component in the
 * route tree, which has the following format:
 *
 *   {
 *     route: <Route>,
 *     computedPath: '...',
 *     childRoutes: [
 *       { route: <Route>, computedPath: '...', childRoutes: [ ... ] },
 *       { route: <Route>, computedPath: '...' }
 *     ]
 *   }
 *
 * Note that if a <Route> doesn't specify a "path" prop, the value of
 * its "name" prop is used as its computedPath. If no "name" is specified,
 * the computedPath is an empty string.
 */
exports.storeRoutes = storeRoutes;
function storeRoutes(routes) {
  _root = routes;
  if (routes.props.children) {
    React.Children.forEach(routes.props.children, function (route) {
      storeRoute(route, _routeTree);
    });
  }
}

function storeRoute(route, _tree) {
  if (route.props.name)
    _namedRoutes[route.props.name] = route;

  var node = { route: route, computedPath: computeRoutePath(route) };
  _tree.push(node);

  // TODO: console.warn here if a child's computedPath doesn't contain
  // some dynamic segments that are contained in any of its parents.

  if (route.props.children) {
    node.childRoutes = [];

    React.Children.forEach(route.props.children, function (child) {
      storeRoute(child, node.childRoutes);
    });
  }
}

function computeRoutePath(route) {
  return (route.props.path || route.props.name || '').replace(/^\/+/, '');
}

var _activeRoutes = [];

/**
 * Returns an array of currently active routes, ordered by depth in the route tree.
 */
exports.getActiveRoutes = getActiveRoutes;
function getActiveRoutes() {
  return _activeRoutes;
}

/**
 * Returns the currently active route.
 */
exports.getActiveRoute = getActiveRoute;
function getActiveRoute() {
  return _activeRoutes[_activeRoutes.length - 1];
}

/**
 * Returns true if the given <Route> is currently active.
 */
exports.isActiveRoute = isActiveRoute;
function isActiveRoute(route, params) {
  if (_activeRoutes.indexOf(route) === -1)
    return false;

  var activeParams = getActiveParams();
  for (var name in activeParams)
    if (params[name] !== activeParams[name])
      return false;

  return true;
}

var _activeQuery = {};
var _activeParams = {};

/**
 * Returns a hash of the currently active URL parameters.
 */
exports.getActiveParams = getActiveParams;
function getActiveParams() {
  return _activeParams;
}

/**
 * Returns a hash of the currently active query string parameters.
 */
exports.getActiveQuery = getActiveQuery;
function getActiveQuery() {
  return _activeQuery;
}



/**
 * Updates the currently active routes and URL parameters.
 */
exports.updateActive = updateActive;
function updateActive(activePath) {
  _activeQuery = extractQuery(activePath);
  _activeParams = findActiveParams(activePath, _routeTree, _activeRoutes = []);

  if (!_activeParams && activePath)
    console.warn('No routes matched path: ' + activePath);
}

var queryMatcher = /\?(.+)/;
function extractQuery(activePath) {
  var queryParams = {};
  var query = activePath.match(queryMatcher);
  return (query) ? qs.parse(query[1]) : {};
}

/**
 * Attempts to match the active path against the computed paths of routes in the
 * given tree, returning the the URL parameters from the first one that matches.
 * Along the way, the given _routes array is populated with <Route> objects that
 * are parents of the matching route, in the order they appear in the tree.
 */
function findActiveParams(_activePath, tree, _routes) {
  activePath = _activePath.replace(queryMatcher, '');
  return findFirst(tree, function (node) {
    var params = path.extractParams(node.computedPath, activePath);

    if (!params && node.childRoutes)
      params = findActiveParams(activePath, node.childRoutes, _routes);

    if (params) {
      _routes.unshift(node.route);
      return params;
    }
  });
}

/**
 * Returns the first truthy value that is returned from applying the given
 * callback to each element in the given array.
 */
function findFirst(array, callback, context) {
  var value;
  for (var i = 0, length = array.length; i < length; ++i) {
    if (value = callback.call(context, array[i], i, array)) {
      return value;
    }
  }
}
