var React = require('react');
var warning = require('warning');
var invariant = require('invariant');
var assign = require('object-assign');

function getComponentName(component) {
  return component.displayName || component.name;
}

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
    checkPropTypes(getComponentName(type), type.propTypes, route);

  if (route.handler) {
    warning(
      false,
      '<%s handler> is deprecated, use <%s component> instead',
      getComponentName(type), getComponentName(type)
    );

    route.component = route.handler;
    delete route.handler;
  }

  // Unless otherwise specified, a route's path defaults to its name.
  if (route.name && route.path == null)
    route.path = route.name;

  if (route.children) {
    route.childRoutes = createRoutesFromReactChildren(route.children);
    delete route.children;
  }

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
 *       <Route name="home" handler={Dashboard}/>
 *       <Route name="news" handler={NewsFeed}/>
 *     </Route>
 *   );
 *
 * This method is automatically used when you provide a ReactChildren
 * object to createRouter.
 *
 *   var Router = createRouter(
 *     <Route .../>
 *   );
 *
 *   React.render(<Router/>, ...);
 */
function createRoutesFromReactChildren(children) {
  var routes = [];

  React.Children.forEach(children, function (element) {
    if (!React.isValidElement(element))
      return;

    routes.push(
      createRouteFromReactElement(element)
    );
  });

  return routes;
}

module.exports = createRoutesFromReactChildren;
