var React = require('react');
var invariant = require('react/lib/invariant');
var Path = require('../utils/Path');

/**
 * Performs some normalization and validation on a <Route> component and
 * all of its children.
 */
function processRoute(route, container, namedRoutes) {
  // Note: parentRoute may be a <Route> _or_ a <Routes>.
  var props = route.props;

  // TODO: use isValidElement when we update everything for React 0.12
  //invariant(
    //React.isValidClass(props.handler),
    //'The handler for the "%s" route must be a valid React class',
    //props.name || props.path
  //);

  var parentPath = (container && container.props.path) || '/';

  if ((props.path || props.name) && !props.isDefault && !props.catchAll) {
    var path = props.path || props.name;

    // Relative paths extend their parent.
    if (!Path.isAbsolute(path))
      path = Path.join(parentPath, path);

    props.path = Path.normalize(path);
  } else {
    props.path = parentPath;

    if (props.catchAll)
      props.path += '*';
  }

  props.paramNames = Path.extractParamNames(props.path);

  // Make sure the route's path has all params its parent needs.
  if (container && Array.isArray(container.props.paramNames)) {
    container.props.paramNames.forEach(function (paramName) {
      invariant(
        props.paramNames.indexOf(paramName) !== -1,
        'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"',
        props.path, paramName, container.props.path
      );
    });
  }

  // Make sure the route can be looked up by <Link>s.
  if (props.name) {
    var existingRoute = namedRoutes[props.name];

    invariant(
      !existingRoute || route === existingRoute,
      'You cannot use the name "%s" for more than one route',
      props.name
    );

    namedRoutes[props.name] = route;
  }

  // Handle <NotFoundRoute>.
  if (props.catchAll) {
    invariant(
      container,
      '<NotFoundRoute> must have a parent <Route>'
    );

    invariant(
      container.props.notFoundRoute == null,
      'You may not have more than one <NotFoundRoute> per <Route>'
    );

    container.props.notFoundRoute = route;

    return null;
  }

  // Handle <DefaultRoute>.
  if (props.isDefault) {
    invariant(
      container,
      '<DefaultRoute> must have a parent <Route>'
    );

    invariant(
      container.props.defaultRoute == null,
      'You may not have more than one <DefaultRoute> per <Route>'
    );

    container.props.defaultRoute = route;

    return null;
  }

  // Make sure children is an array.
  props.children = processRoutes(props.children, route, namedRoutes);

  return route;
}

/**
 * Processes many children <Route>s at once, always returning an array.
 */
function processRoutes(children, container, namedRoutes) {
  var routes = [];

  React.Children.forEach(children, function (child) {
    // Exclude <DefaultRoute>s and <NotFoundRoute>s.
    if (child = processRoute(child, container, namedRoutes))
      routes.push(child);
  });

  return routes;
}

/**
 * A mixin for components that have <Route> children.
 */
var RouteContext = {

  _processRoutes: function () {
    this._namedRoutes = {};
    this._routes = processRoutes(this.props.children, this, this._namedRoutes);
  },

  /**
   * Returns an array of <Route>s in this container.
   */
  getRoutes: function () {
    if (this._routes == null)
      this._processRoutes();

    return this._routes;
  },

  /**
   * Returns a hash { name: route } of all named <Route>s in this container.
   */
  getNamedRoutes: function () {
    if (this._namedRoutes == null)
      this._processRoutes();

    return this._namedRoutes;
  },

  /**
   * Returns the route with the given name.
   */
  getRouteByName: function (routeName) {
    var namedRoutes = this.getNamedRoutes();
    return namedRoutes[routeName] || null;
  },

  childContextTypes: {
    routes: React.PropTypes.array.isRequired,
    namedRoutes: React.PropTypes.object.isRequired
  },

  getChildContext: function () {
    return {
      routes: this.getRoutes(),
      namedRoutes: this.getNamedRoutes(),
    };
  }

};

module.exports = RouteContext;
