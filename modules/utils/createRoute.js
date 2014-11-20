var React = require('react');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var DefaultRoute = require('../elements/DefaultRoute');
var NotFoundRoute = require('../elements/NotFoundRoute');
var Redirect = require('../elements/Redirect');
var Route = require('../elements/Route');
var Path = require('./Path');

var CONFIG_ELEMENTS = [ DefaultRoute, NotFoundRoute, Redirect, Route ];

function createRedirectHandler(to, _params, _query) {
  return React.createClass({
    statics: {
      willTransitionTo: function (transition, params, query) {
        transition.redirect(to, _params || params, _query || query);
      }
    },

    render: function () {
      return null;
    }
  });
}

function checkPropTypes(elementName, propTypes, props) {
  for (var propName in propTypes) {
    if (propTypes.hasOwnProperty(propName)) {
      var error = propTypes[propName](props, propName, elementName);

      if (error instanceof Error)
        warning(false, error.message);
    }
  }
}

function createRoute(element, parentRoute, namedRoutes) {
  var type = element.type;
  var props = element.props;
  var elementName = (type && type.displayName) || 'UnknownElement';

  invariant(
    CONFIG_ELEMENTS.indexOf(type) !== -1,
    'Unrecognized route configuration element "<%s>"',
    elementName
  );

  if (type.propTypes)
    checkPropTypes(elementName, type.propTypes, props);

  var route = { name: props.name };

  if (type === Redirect) {
    route.handler = createRedirectHandler(props.to, props.params, props.query);
  } else {
    route.handler = props.handler;
  }

  invariant(
    typeof route.handler === 'function',
    'The handler for the "%s" route must be a ReactElement',
    props.name || props.path
  );

  var parentPath = (parentRoute && parentRoute.path) || '/';

  if ((props.path || props.name) && type !== DefaultRoute && type !== NotFoundRoute) {
    var path = props.path || props.name;

    // Relative paths extend their parent.
    if (!Path.isAbsolute(path))
      path = Path.join(parentPath, path);

    route.path = Path.normalize(path);
  } else {
    route.path = parentPath;

    if (type === NotFoundRoute)
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
  if (type === NotFoundRoute) {
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
  if (type === DefaultRoute) {
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

module.exports = createRoute;
