var React = require('react');
var merge = require('react/lib/merge');
var mergeInto = require('react/lib/mergeInto');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var path = require('./path');
var urlStore = require('./stores/url-store');

var _lookupTable = {};

/**
 * A Router specifies a component that will be rendered to the page when the URL
 * matches a given pattern. Routers may also be named, which makes it easy for
 * <Link> components to link to them.
 * 
 * Routers are arranged in a nested tree structure. Likewise, when a router's component
 * is rendered, it is nested inside all components of its ancestor routers.
 *
 * Unlike Ember, a nested router's URL pattern does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URL patterns, but it
 * has the nice benefit of decoupling nested UI from nested URL segments.
 * 
 *   var AppRouter = Router('/', App, function (route) {
 *     route('/posts', Posts, function (route) {
 *       route('/posts/new', 'newPost', NewPost);
 *       route('/posts/:id', 'showPost', Post);
 *     });
 *   });
 *   
 *   AppRouter.match('/posts/123'); => [ { router: <AppRouter>, params: {} },
 *                                       { router: <PostsRouter>, params: {} },
 *                                       { router: <PostRouter>, params: { id: '123' } } ]
 *
 *   React.renderComponent(AppRouter.getComponent(), document.body);
 */
function Router(pattern, name, handler, callback) {
  // Support Router(<Route>) usage.
  if (React.isValidComponent(pattern))
    return Router.fromComponent(pattern);

  // Support Router(...) usage, without new.
  if (!(this instanceof Router))
    return new Router(pattern, name, handler, callback);

  // Support Router('/', App) usage, without a name.
  if (React.isValidComponent(name)) {
    callback = handler;
    handler = name;
    name = null;
  }

  pattern = pattern ? path.normalize(pattern) : '';

  // For now, the handler must be a React component. We could easily
  // swap this out with a RouteHandler object for more advanced usage.
  invariant(
    React.isValidComponent(handler),
    'Router "' + name + '" must have a valid React component for a handler'
  );

  // If this router has a name, store it for lookup by <Link> components.
  if (name) {
    invariant(
      !_lookupTable[name],
      'You cannot use the name "' + name + '" for more than one router'
    );

    _lookupTable[name] = this;
  }

  this.pattern = pattern;
  this.name = name;
  this.handler = handler;

  this.displayName = componentToString(this.handler) + 'Router';

  this.childRouters = [];

  if (typeof callback === 'function') {
    invariant(
      callback.length === 1,
      'A Router callback should have one argument, a function that is usually named "route". ' +
      'You may have forgotten to include this argument when writing out nested routers like ' +
      'Router("/", App, function (/* missing "route" argument here! */) { ... })'
    );

    callback(this.route.bind(this));
  }
}

/**
 * Returns the router with the given name.
 */
Router.lookup = function (name) {
  return _lookupTable[name];
};

var Route = require('./components/route');

/**
 * A convenience method that creates a Router from a <Route> component. This allows
 * you to use JSX to describe your route hierarchy instead of the JavaScript API.
 *
 *   var AppRouter = Router.fromComponent(
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   );
 */
Router.fromComponent = function (routeComponent) {
  invariant(
    routeComponent.type === Route.type,
    'A Router may only be created from <Route> components'
  );

  var name = routeComponent.props.name;
  var pattern = routeComponent.props.path || name;
  var router = new Router(pattern, name, routeComponent.props.handler);

  // Hang on to any extra properties that were passed to the component.
  router._componentProps = Route.getUnreservedProps(routeComponent.props);

  React.Children.forEach(routeComponent.props.children, function (child) {
    router.childRouters.push(Router.fromComponent(child));
  });

  return router;
};

mergeInto(Router.prototype, {

  /**
   * Adds a child router with the given arguments to this router and returns the
   * newly created child router.
   */
  route: function (name, path, component, callback) {
    var router = new Router(name, path, component, callback);
    this.childRouters.push(router);
    return router;
  },

  /**
   * Searches this Router and its subtree depth-first for a Router that matches on
   * the given path. Returns an array of all routes in the tree leading to the one
   * that matched in the format { route, params } where params is an object that
   * contains the URL parameters relevant to that route. Returns null if no Router
   * in the tree matches the path.
   */
  match: function (currentPath) {
    var childRouters = this.childRouters, match;

    // Search the subtree first to find the most deeply-nested route.
    for (var i = 0, length = childRouters.length; i < length; ++i) {
      match = childRouters[i].match(currentPath);

      if (match) {
        var rootMatch = match[match.length - 1];
        var rootRouter = rootMatch.router;
        var rootParams = rootMatch.params;

        var paramNames = path.extractParamNames(this.pattern);
        var params = {};

        paramNames.forEach(function (paramName) {
          // Ensure the child route contains all dynamic segments in this route. 
          // TODO: We should probably do this when routes are first declared.
          invariant(
            rootParams[paramName],
            'Router pattern "' + rootRouter.pattern + '" does not contain all parameters ' +
            'of its ancestor pattern "' + this.pattern + '", so they cannot be nested'
          );

          params[paramName] = rootParams[paramName];
        });

        match.unshift(createMatch(this, params));

        return match;
      }
    }

    // No routes in the subtree matched, so check this route.
    var params = path.extractParams(this.pattern, currentPath);

    if (params)
      return [ createMatch(this, params) ];

    return null;
  },

  /**
   * Returns a React component that can be used to render this Router. This
   * method should only ever be used to insert top-level components that are
   * passed directly to React.renderComponent, e.g.:
   *
   *   React.renderComponent(Router.getComponent(), document.body);
   */
  getComponent: function () {
    if (!this._componentInstance) {
      if (!urlStore.isSetup() && ExecutionEnvironment.canUseDOM)
        urlStore.setup('hash');

      this._componentInstance = this.handler(this._getComponentProps(urlStore.getCurrentPath()));

      urlStore.addChangeListener(function () {
        this._updateComponentProps(urlStore.getCurrentPath());
      }.bind(this));
    }

    return this._componentInstance;
  },

  _getComponentProps: function (currentPath) {
    var match = this.match(path.withoutQuery(currentPath));
    var query = path.extractQuery(currentPath) || {};

    warning(
      !(currentPath && !match),
      'No routes matched path "' + currentPath + '"'
    );

    var props = {
      currentPath: currentPath,
      activeMatch: match,
      activeQuery: query
    };

    if (this._componentProps)
      return merge(this._componentProps, props);

    return props;
  },

  _updateComponentProps: function (currentPath) {
    this._componentInstance.setProps(this._getComponentProps(currentPath));
  },

  toString: function () {
    return '<' + this.displayName + '>';
  }

});

function createMatch(router, params) {
  return { router: router, params: params };
}

function componentToString(component) {
  return component.type.displayName || 'UnnamedComponent';
}

module.exports = Router;
