var React = require('react');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
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
   * Removes all references to <Route>s from the store. Should only ever
   * really be used in tests to clear the store between test runs.
   */
  unregisterAllRoutes: function () {
    _namedRoutes = {};
  },

  /**
   * Removes the reference to the given <Route> and all of its children
   * from the store.
   */
  unregisterRoute: function (route) {
    var props = route.props;

    if (props.name)
      delete _namedRoutes[props.name];

    React.Children.forEach(props.children, RouteStore.unregisterRoute);
  },

  /**
   * Registers a <Route> and all of its children with the store. Also,
   * does some normalization and validation on route props.
   */
  registerRoute: function (route, parentRoute) {
    // Note: parentRoute may be a <Route> _or_ a <Routes>.
    var props = route.props;

    invariant(
      React.isValidClass(props.handler),
      'The handler for the "%s" route must be a valid React class',
      props.name || props.path
    );

    // Default routes have no name, path, or children.
    var isDefault = !(props.path || props.name || props.children);

    if (props.path || props.name) {
      props.path = Path.normalize(props.path || props.name);
    } else if (parentRoute && parentRoute.props.path) {
      props.path = parentRoute.props.path;
    } else {
      props.path = '/';
    }

    props.paramNames = Path.extractParamNames(props.path);

    // Make sure the route's path has all params its parent needs.
    if (parentRoute && Array.isArray(parentRoute.props.paramNames)) {
      parentRoute.props.paramNames.forEach(function (paramName) {
        invariant(
          props.paramNames.indexOf(paramName) !== -1,
          'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"',
          props.path, paramName, parentRoute.props.path
        );
      });
    }

    // Make sure the route can be looked up by <Link>s.
    if (props.name) {
      var existingRoute = _namedRoutes[props.name];

      invariant(
        !existingRoute || route === existingRoute,
        'You cannot use the name "%s" for more than one route',
        props.name
      );

      _namedRoutes[props.name] = route;
    }

    if (parentRoute && isDefault) {
      invariant(
        parentRoute.props.defaultRoute == null,
        'You may not have more than one <DefaultRoute> per <Route>'
      );

      parentRoute.props.defaultRoute = route;

      return null;
    }

    // Make sure children is an array.
    props.children = RouteStore.registerChildren(props.children, route);

    return route;
  }

  /**
   * Registers many children routes at once, always returning an array.
   */
  registerChildren: function (children, parentRoute) {
    var routes = [];

    React.Children.forEach(children, function (child) {
      // Exclude <DefaultRoute>s.
      if (child = RouteStore.registerRoute(child, parentRoute))
        routes.push(child);
    });

    return routes;
  },

  /**
   * Returns the Route object with the given name, if one exists.
   */
  getRouteByName: function (routeName) {
    return _namedRoutes[routeName] || null;
  }

};

module.exports = RouteStore;
