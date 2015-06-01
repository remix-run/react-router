import React, { isValidElement } from 'react';
import warning from 'warning';

function isValidChild(object) {
  return object == null || isValidElement(object);
}

export function isReactChildren(object) {
  return isValidChild(object) || (Array.isArray(object) && object.every(isValidChild));
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

export function createRouteFromReactElement(element) {
  var type = element.type;
  var route = Object.assign({}, type.defaultProps, element.props);

  if (type.propTypes)
    checkPropTypes(type.displayName || type.name, type.propTypes, route);

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
 *   import { Route, createRoutesFromReactChildren } from 'react-router';
 *   
 *   var routes = createRoutesFromReactChildren(
 *     <Route component={App}>
 *       <Route path="home" component={Dashboard}/>
 *       <Route path="news" component={NewsFeed}/>
 *     </Route>
 *   );
 *
 * Note: This method is automatically used when you provide <Route> children
 * to a <Router> component.
 */
export function createRoutesFromReactChildren(children) {
  var routes = [];

  React.Children.forEach(children, function (element) {
    if (isValidElement(element)) {
      // Component classes may have a static create* method.
      if (element.type.createRouteFromReactElement) {
        routes.push(element.type.createRouteFromReactElement(element));
      } else {
        routes.push(createRouteFromReactElement(element));
      }
    }
  });

  return routes;
}

/**
 * Creates and returns an array of routes from the given object which
 * may be a JSX route, a plain object route, or an array of either.
 */
export function createRoutes(routes) {
  if (isReactChildren(routes)) {
    routes = createRoutesFromReactChildren(routes);
  } else if (!Array.isArray(routes)) {
    routes = [ routes ];
  }

  return routes;
}
