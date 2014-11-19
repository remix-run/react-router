var React = require('react');
var invariant = require('react/lib/invariant');
var RedirectComponent = require('../components/Redirect');
var Route = require('./Route');
var Redirect = require('./Redirect');
var Path = require('./Path');

/**
 * Performs some normalization and validation on a <Route> component and
 * all of its children.
 */
function processRoute(component, parentRoute, namedRoutes) {
  if (component.props.isRedirect)
    component = RedirectComponent.createRoute(component.props);

  var props = component.props;

  invariant(
    typeof props.handler === 'function',
    'The handler for the "%s" route must be a React component class',
    props.name || props.path
  );

  var route = new Route(props.handler, props.name);
  var parentPath = (parentRoute && parentRoute.path) || '/';

  if ((props.path || props.name) && !props.isDefault && !props.catchAll) {
    var path = props.path || props.name;

    // Relative paths extend their parent.
    if (!Path.isAbsolute(path))
      path = Path.join(parentPath, path);

    route.path = Path.normalize(path);
  } else {
    route.path = parentPath;

    if (props.catchAll)
      route.path += '*';
  }

  route.paramNames = Path.extractParamNames(route.path);

  // Make sure the route's path has all params its parent needs.
  if (parentRoute && Array.isArray(parentRoute.paramNames)) {
    parentRoute.paramNames.forEach(function (paramName) {
      invariant(
        route.paramNames.indexOf(paramName) !== -1,
        'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"',
        route.path, paramName, parentRoute.path
      );
    });
  }

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
  if (props.catchAll) {
    invariant(
      parentRoute,
      '<NotFoundRoute> must have a parent <Route>'
    );

    invariant(
      parentRoute.notFoundRoute == null,
      'You may not have more than one <NotFoundRoute> per <Route>'
    );

    parentRoute.notFoundRoute = route;

    return null;
  }

  // Handle <DefaultRoute>.
  if (props.isDefault) {
    invariant(
      parentRoute,
      '<DefaultRoute> must have a parent <Route>'
    );

    invariant(
      parentRoute.defaultRoute == null,
      'You may not have more than one <DefaultRoute> per <Route>'
    );

    parentRoute.defaultRoute = route;

    return null;
  }

  route.childRoutes = createRoutesFromChildren(props.children, route, namedRoutes);

  return route;
}

/**
 * Processes many children <Route>s at once, always returning an array.
 */
function createRoutesFromChildren(children, parentRoute, namedRoutes) {
  var routes = [];

  React.Children.forEach(children, function (child) {
    // Exclude <DefaultRoute>s and <NotFoundRoute>s.
    if (child = processRoute(child, parentRoute, namedRoutes))
      routes.push(child);
  });

  return routes;
}

module.exports = createRoutesFromChildren;
