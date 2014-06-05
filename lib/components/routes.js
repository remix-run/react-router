var React = require('react');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var path = require('../path');
var urlStore = require('../stores/url-store');

var RESERVED_PROPS = {
  location: true,
  handler: true,
  children: true // ReactChildren
};

var Routes = React.createClass({

  propTypes: {
    location: React.PropTypes.string.isRequired,
    handler: React.PropTypes.component.isRequired
  },

  getDefaultProps: function () {
    return {
      location: 'hash'
    };
  },

  getInitialState: function () {
    return {
      currentPath: '',
      activeRoutes: [],
      activeParams: {},
      activeQuery: {}
    };
  },

  getRoutes: function () {
    if (!this._routes)
      this._routes = findRoutes(this.props.children);

    return this._routes;
  },

  getUnreservedProps: function () {
    var props = this.props;
    var unreservedProps = {};

    for (var name in props) {
      if (!RESERVED_PROPS[name]) {
        unreservedProps[name] = props[name];
      }
    }

    return unreservedProps;
  },

  componentWillMount: function () {
    // TODO: Can we get the routes into the route store before now? The
    // problem is that any <Link> components that reference child <Route>s
    // won't be able to find them until this <Routes> is mounted.
    storeRoutes(this.getRoutes());

    if (ExecutionEnvironment.canUseDOM)
      urlStore.setup(this.props.location);

    urlStore.addChangeListener(this.handleRouteChange);

    this.updateActive(urlStore.getCurrentPath());
  },

  componentWillUnmount: function () {
    urlStore.removeChangeListener(this.handleRouteChange);
  },

  handleRouteChange: function () {
    this.updateActive(urlStore.getCurrentPath());
  },

  updateActive: function (currentPath) {
    var routes = [];
    var params = findActiveParams(path.withoutQuery(currentPath), this.getRoutes(), routes) || {};
    var query = path.extractQuery(currentPath) || {};

    warning(
      !(currentPath && !routes.length),
      'No routes matched path "' + currentPath + '"'
    );

    this.setState({
      currentPath: currentPath,
      activeRoutes: routes,
      activeParams: params,
      activeQuery: query
    });
  },

  render: function () {
    var activeRoutes = this.state.activeRoutes;
    var activeParams = this.state.activeParams;
    var activeQuery = this.state.activeQuery;

    var lastHandler, LastHandler;

    reversedArray(activeRoutes).forEach(function (route) {
      var props = { params: activeParams, query: activeQuery };

      if (lastHandler) {
        props.activeRoute = lastHandler;
        props.ActiveRoute = LastHandler;
      } else {
        // make sure transitioning to the same route with new
        // params causes an update
        props.key = urlStore.getCurrentPath();
      }

      LastHandler = route.props.handler;
      lastHandler = LastHandler(props);
    });

    var props = this.getUnreservedProps();

    props.activeRoute = lastHandler;
    props.ActiveRoute = LastHandler;
    props.params = activeParams;
    props.query = activeQuery;

    return this.props.handler(props);
  }

});

function reversedArray(array) {
  return array.slice(0).reverse();
}

var Route = require('./route');

/**
 * Returns a nested array of all <Route>s in the given children.
 */
function findRoutes(children) {
  var tree = [];

  React.Children.forEach(children, function (child) {
    invariant(child.type === Route.type, 'All children of <Routes> must be <Route>s');

    var node = { route: child, computedPath: path.forRoute(child) };
    tree.push(node);

    // TODO: Emit a warning if a child's computedPath doesn't contain
    // some dynamic segments that are contained in any of its parents.

    if (child.props.children) {
      var childRoutes = findRoutes(child.props.children);

      if (childRoutes.length)
        node.childRoutes = childRoutes;
    }
  });

  return tree;
}

/**
 * Attempts to match the active path against the computed paths of routes in the
 * given tree, returning the the URL parameters from the first one that matches.
 * Along the way, the given routes array is populated with <Route> components that
 * are parents of the matching route, in the order they appear in the tree.
 */
function findActiveParams(currentPath, tree, routes) {
  return findFirst(tree, function (node) {
    var params = path.extractParams(node.computedPath, currentPath);

    if (!params && node.childRoutes)
      params = findActiveParams(currentPath, node.childRoutes, routes);

    if (params) {
      routes.unshift(node.route);
      return params;
    }
  });
}

/**
 * Returns the first truthy value that is returned from applying the given
 * callback to each element in the given array.
 */
function findFirst(array, callback, context) {
  var value;
  for (var i = 0, length = array.length; i < length; ++i) {
    if (value = callback.call(context, array[i], i, array)) {
      return value;
    }
  }
}

var routeStore = require('../stores/route-store');

function storeRoutes(tree) {
  tree.forEach(function (node) {
    if (node.childRoutes)
      storeRoutes(node.childRoutes);
    
    routeStore.addRoute(node.route);
  });
}

module.exports = Routes;

