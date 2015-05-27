import React from 'react';
import warning from 'warning';

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
  var componentName = type.displayName || type.name;
  var route = Object.assign({}, type.defaultProps, element.props);

  if (type.propTypes)
    checkPropTypes(componentName, type.propTypes, route);

  if (route.handler) {
    warning(
      false,
      '<%s handler> is deprecated, use <%s component> instead',
      componentName, componentName
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
 *   var { Route } = require('react-router');
 *   
 *   var routes = createRoutesFromReactChildren(
 *     <Route component={App}>
 *       <Route name="home" component={Dashboard}/>
 *       <Route name="news" component={NewsFeed}/>
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
    if (React.isValidElement(element))
      routes.push(createRouteFromReactElement(element));
  });

  return routes;
}

export default createRoutesFromReactChildren;
