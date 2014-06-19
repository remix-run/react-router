var React = require('react');
var invariant = require('react/lib/invariant');
var getComponentDisplayName = require('./helpers/getComponentDisplayName');
var mergeProperties = require('./helpers/mergeProperties');
var RouteComponent = require('./components/Route');
var Path = require('./Path');

var _namedRoutes = {};

function Route(options, _parentRoute) {
  options = options || {};

  this.name = options.name;
  this.path = Path.normalize(options.path || options.name || '/');
  this.handler = options.handler;
  this.staticProps = options.staticProps;

  // Make sure the route has a valid handler.
  invariant(
    React.isValidComponent(this.handler),
    'The handler for Route "' + (this.name || this.path) + '" must be a valid React component'
  );

  this.displayName = getComponentDisplayName(this.handler) + 'Route';
  this.paramNames = Path.extractParamNames(this.path);

  // Make sure the route's path contains all params of its parent.
  if (_parentRoute) {
    _parentRoute.paramNames.forEach(function (paramName) {
      invariant(
        this.paramNames.indexOf(paramName) !== -1,
        'The nested route path "' + this.path + '" is missing the "' + paramName + '" ' +
        'parameter of its parent path "' + _parentRoute.path + '"'
      );
    }, this);
  }

  // If the route has a name, store it for lookup by <Link> components.
  if (this.name) {
    invariant(
      !_namedRoutes[this.name],
      'You cannot use the name "' + this.name + '" for more than one route'
    );

    _namedRoutes[this.name] = this;
  }
}

mergeProperties(Route.prototype, {

  toString: function () {
    return '<' + this.displayName + '>';
  }

});

mergeProperties(Route, {

  /**
   * Creates and returns a Route object from a <Route> component.
   */
  fromComponent: function (component, _parentRoute) {
    invariant(
      React.isValidComponent(component) && component.type === RouteComponent.type,
      'The Router may only contain <Route> components'
    );

    var route = new Route({
      name: component.props.name,
      path: component.props.path,
      handler: component.props.handler,
      staticProps: RouteComponent.getUnreservedProps(component.props)
    }, _parentRoute);

    if (component.props.children) {
      var childRoutes = route.childRoutes = [];

      React.Children.forEach(component.props.children, function (child) {
        childRoutes.push(Route.fromComponent(child, route));
      });
    }

    return route;
  },

  /**
   * Returns the Route object with the given name, if one exists.
   */
  getByName: function (routeName) {
    return _namedRoutes[routeName];
  },

  /**
   * Removes references to all named Routes. Useful in tests.
   */
  clearNamedRoutes: function () {
    _namedRoutes = {};
  }

});

module.exports = Route;
