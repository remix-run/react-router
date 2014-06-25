var React = require('react');
var invariant = require('react/lib/invariant');
var Path = require('../helpers/Path');

var _namedRoutes = {};

/**
 * The RouteStore contains a directory of all <Route>s in the system. It is
 * used primarily for looking up routes by name so that <Link>s can use a
 * route name in the "to" prop and users can use route names in `Router.transitionTo`
 * and other high-level utility methods.
 */
var RouteStore = {

  /**
   * Registers a <Route> and all of its children with the RouteStore. Also,
   * does some normalization and validation on route props.
   */
  registerRoute: function (route, _parentRoute) {
    // Make sure the <Route>'s path begins with a slash. Default to its name.
    // We can't do this in getDefaultProps because it may not be called on
    // <Route>s that are never actually mounted.
    if (route.props.path || route.props.name) {
      route.props.path = Path.normalize(route.props.path || route.props.name);
    } else {
      route.props.path = '/';
    }

    // Make sure the <Route> has a valid React component for a handler.
    invariant(
      React.isValidComponent(route.props.handler),
      'The handler for Route "' + (route.props.name || route.props.path) + '" ' +
      'must be a valid React component'
    );

    // Make sure the <Route> has all params that its parent needs.
    if (_parentRoute) {
      var paramNames = Path.extractParamNames(route.props.path);

      Path.extractParamNames(_parentRoute.props.path).forEach(function (paramName) {
        invariant(
          paramNames.indexOf(paramName) !== -1,
          'The nested route path "' + route.props.path + '" is missing the "' + paramName + '" ' +
          'parameter of its parent path "' + _parentRoute.props.path + '"'
        );
      });
    }

    // Make sure the <Route> can be looked up by <Link>s.
    if (route.props.name) {
      var existingRoute = _namedRoutes[route.props.name];

      invariant(
        !existingRoute || route === existingRoute,
        'You cannot use the name "' + route.props.name + '" for more than one route'
      );

      _namedRoutes[route.props.name] = route;
    }

    React.Children.forEach(route.props.children, function (child) {
      RouteStore.registerRoute(child, route);
    });
  },

  /**
   * Removes the reference to the given <Route> and all of its children from
   * the RouteStore.
   */
  unregisterRoute: function (route) {
    if (route.props.name)
      delete _namedRoutes[route.props.name];

    React.Children.forEach(route.props.children, function (child) {
      RouteStore.unregisterRoute(route);
    });
  },

  /**
   * Returns the Route object with the given name, if one exists.
   */
  getRouteByName: function (routeName) {
    return _namedRoutes[routeName] || null;
  }

};

module.exports = RouteStore;
