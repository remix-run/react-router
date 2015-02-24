/* jshint -W084 */
var React = require('react');
var assign = require('react/lib/Object.assign');
var warning = require('react/lib/warning');
var DefaultRouteType = require('./components/DefaultRoute').type;
var NotFoundRouteType = require('./components/NotFoundRoute').type;
var RedirectType = require('./components/Redirect').type;
var Route = require('./Route');

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

function createRouteOptions(props) {
  var options = assign({}, props);
  var handler = options.handler;

  if (handler) {
    options.onEnter = handler.willTransitionTo;
    options.onLeave = handler.willTransitionFrom;
  }

  return options;
}

function createRouteFromReactElement(element) {
  if (!React.isValidElement(element))
    return;

  var type = element.type;
  var props = element.props;

  if (type.propTypes)
    checkPropTypes(type.displayName, type.propTypes, props);

  if (type === DefaultRouteType)
    return Route.createDefaultRoute(createRouteOptions(props));

  if (type === NotFoundRouteType)
    return Route.createNotFoundRoute(createRouteOptions(props));

  if (type === RedirectType)
    return Route.createRedirect(createRouteOptions(props));

  return Route.createRoute(createRouteOptions(props), function () {
    if (props.children)
      createRoutesFromReactChildren(props.children);
  });
}

/**
 * Creates and returns an array of routes created from the given
 * ReactChildren, all of which should be one of <Route>, <DefaultRoute>,
 * <NotFoundRoute>, or <Redirect>, e.g.:
 *
 *   var { createRoutesFromReactChildren, Route, Redirect } = require('react-router');
 *
 *   var routes = createRoutesFromReactChildren(
 *     <Route path="/" handler={App}>
 *       <Route name="user" path="/user/:userId" handler={User}>
 *         <Route name="task" path="tasks/:taskId" handler={Task}/>
 *         <Redirect from="todos/:taskId" to="task"/>
 *       </Route>
 *     </Route>
 *   );
 */
function createRoutesFromReactChildren(children) {
  var routes = [];

  React.Children.forEach(children, function (child) {
    if (child = createRouteFromReactElement(child))
      routes.push(child);
  });

  return routes;
}

module.exports = createRoutesFromReactChildren;
