var React = require('react');
var assign = require('object-assign');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var validateRoute = require('./validateRoute');
var DefaultRoute = require('./components/DefaultRoute');
var CatchAllRoute = require('./components/CatchAllRoute');
var Redirect = require('./components/Redirect');

function checkPropTypes(componentName, propTypes, props) {
  componentName = componentName || 'UnknownComponent';

  for (var propName in propTypes) {
    if (propTypes.hasOwnProperty(propName)) {
      var error = propTypes[propName](props, propName, componentName);

      if (error instanceof Error)
        warning(false, error.message);
    }
  }
}

function createRouteFromReactElement(element) {
  var type = element.type;
  var route = assign({}, type.defaultProps, element.props);

  if (type.propTypes)
    checkPropTypes(type.displayName, type.propTypes, route);

  if (type === DefaultRoute) {
    invariant(
      route.children == null,
      'A <DefaultRoute> may not have child routes'
    );

    warning(
      route.path == null || route.path === '',
      'A <DefaultRoute>\'s route.path is always ""; ignoring "%s"',
      route.path
    );

    route.path = '';
  } else if (type === CatchAllRoute) {
    invariant(
      route.children == null,
      'A <CatchAllRoute> may not have child routes'
    );

    warning(
      route.path == null || route.path === '*',
      'A <CatchAllRoute>\'s route.path is always "*"; ignoring "%s"',
      route.path
    );

    route.path = '*';
  } else if (type === Redirect) {
    invariant(
      route.children == null,
      'A <Redirect> may not have child routes'
    );

    route.path = route.path || route.from || '*';
    route.onEnter = function (transition, params, query) {
      transition.redirect(route.to, route.params || params, route.query || query);
    };
  } else {
    if (route.children) {
      route.childRoutes = createRoutesFromReactChildren(route.children, route);
      delete route.children;
    }
  }

  validateRoute(route);

  return route;
}

/**
 * Creates and returns a routes object from the given ReactChildren. JSX
 * provides a convenient way to visualize how routes in the hierarchy are
 * nested.
 *
 *   var { Route, DefaultRoute, CatchAllRoute } = require('react-router');
 *   
 *   var routes = createRoutesFromReactChildren(
 *     <Route handler={App}>
 *       <DefaultRoute handler={Dashboard}/>
 *       <Route path="news" handler={NewsFeed}/>
 *       <CatchAllRoute handler={NotFound}/>
 *     </Route>
 *   );
 *
 * This method is automatically used when you provide a ReactChildren
 * object as your routes.
 *
 *   var RootComponent = React.createClass({
 *     statics: {
 *       routes: (
 *         <Route .../>
 *       )
 *     }
 *   });
 *
 *   var Router = createRouter(RootComponent);
 */
function createRoutesFromReactChildren(children, _parentRoute) {
  var routes = [];
  var defaultRoute, catchAllRoute;

  React.Children.forEach(children, function (element) {
    if (!React.isValidElement(element))
      return;

    var route = createRouteFromReactElement(element);

    if (element.type === DefaultRoute) {
      invariant(
        _parentRoute == null || defaultRoute == null,
        'A route may not have more than one <DefaultRoute>'
      );

      defaultRoute = route;
    } else if (element.type === CatchAllRoute) {
      invariant(
        _parentRoute == null || catchAllRoute == null,
        'A route may not have more than one <CatchAllRoute>'
      );

      catchAllRoute = route;
    } else {
      routes.push(route);
    }
  });

  // Order here is important. We want to try the default route
  // before the catch-all but *after* all other routes.
  if (defaultRoute)
    routes.push(defaultRoute);

  if (catchAllRoute)
    routes.push(catchAllRoute);

  return routes;
}

module.exports = createRoutesFromReactChildren;
