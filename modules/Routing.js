/* jshint -W084 */
var React = require('react');
var invariant = require('react/lib/invariant');
var DefaultRoute = require('./components/DefaultRoute');
var NotFoundRoute = require('./components/NotFoundRoute');
var Redirect = require('./components/Redirect');
var Path = require('./utils/Path');

function createTransitionToHook(to, _params, _query) {
  return function (transition, params, query) {
    transition.redirect(to, _params || params, _query || query);
  };
}

function createRoute(element, parentRoute, namedRoutes) {
  var type = element.type;
  var props = element.props;

  if (type.validateProps)
    type.validateProps(props);

  var options = {
    name: props.name,
    ignoreScrollBehavior: !!props.ignoreScrollBehavior
  };

  if (type === Redirect.type) {
    options.willTransitionTo = createTransitionToHook(props.to, props.params, props.query);
    props.path = props.path || props.from || '*';
  } else {
    options.handler = props.handler;
    options.willTransitionTo = props.handler && props.handler.willTransitionTo;
    options.willTransitionFrom = props.handler && props.handler.willTransitionFrom;
  }

  var parentPath = (parentRoute && parentRoute.path) || '/';

  if ((props.path || props.name) && type !== DefaultRoute.type && type !== NotFoundRoute.type) {
    var path = props.path || props.name;

    // Relative paths extend their parent.
    if (!Path.isAbsolute(path))
      path = Path.join(parentPath, path);

    options.path = Path.normalize(path);
  } else {
    options.path = parentPath;

    if (type === NotFoundRoute.type)
      options.path += '*';
  }

  options.paramNames = Path.extractParamNames(options.path);

  // Make sure the route's path has all params its parent needs.
  if (parentRoute && Array.isArray(parentRoute.paramNames)) {
    parentRoute.paramNames.forEach(function (paramName) {
      invariant(
        options.paramNames.indexOf(paramName) !== -1,
        'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"',
        options.path, paramName, parentRoute.path
      );
    });
  }

  var route = new Route(options);

  // Make sure the route can be looked up by <Link>s.
  if (props.name) {
    invariant(
      namedRoutes[props.name] == null,
      'You cannot use the name "%s" for more than one route',
      props.name
    );

    namedRoutes[props.name] = route;
  }

  // Handle <NotFoundRoute>.
  if (type === NotFoundRoute.type) {
    invariant(
      parentRoute,
      '<NotFoundRoute> must have a parent <Route>'
    );

    invariant(
      parentRoute.notFoundRoute == null,
      'You may not have more than one <NotFoundRoute> per <Route>'
    );

    invariant(
      React.Children.count(props.children) === 0,
      '<NotFoundRoute> must not have children'
    );

    parentRoute.notFoundRoute = route;

    return null;
  }

  // Handle <DefaultRoute>.
  if (type === DefaultRoute.type) {
    invariant(
      parentRoute,
      '<DefaultRoute> must have a parent <Route>'
    );

    invariant(
      parentRoute.defaultRoute == null,
      'You may not have more than one <DefaultRoute> per <Route>'
    );

    invariant(
      React.Children.count(props.children) === 0,
      '<DefaultRoute> must not have children'
    );

    parentRoute.defaultRoute = route;

    return null;
  }

  route.routes = createRoutesFromReactChildren(props.children, route, namedRoutes);

  return route;
}

/**
 * Creates and returns an array of route objects from the given ReactChildren.
 */
function createRoutesFromReactChildren(children, parentRoute, namedRoutes) {
  var routes = [];

  React.Children.forEach(children, function (child) {
    // Exclude null values, <DefaultRoute>s and <NotFoundRoute>s.
    if (React.isValidElement(child) && (child = createRoute(child, parentRoute, namedRoutes)))
      routes.push(child);
  });

  return routes;
}

function Route(options) {
  options = options || {};

  this.name = options.name;
  this.path = options.path || '/';
  this.paramNames = options.paramNames || Path.extractParamNames(this.path);
  this.ignoreScrollBehavior = !!options.ignoreScrollBehavior;
  this.willTransitionTo = options.willTransitionTo;
  this.willTransitionFrom = options.willTransitionFrom;
  this.handler = options.handler;
}

module.exports = {
  createRoutesFromReactChildren: createRoutesFromReactChildren,
  Route: Route
};
