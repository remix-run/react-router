var React = require('react');
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
 * Routers are arranged in a nested tree structure. When a new URL is requested, the
 * tree is searched depth-first to find a route whose pattern matches the URL. When one
 * is found, all routes in the tree that lead to it are considered "active" and their
 * components are rendered into the DOM, nested in the same order as they are in the tree.
 *
 * Unlike Ember, a nested router's URL pattern does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URLs, but it has the
 * nice benefit of decoupling nested UI from "nested" URLs.
 *
 * The preferred way to configure a router is using JSX. The XML-like syntax is an excellent
 * tool that helps to visualize the way routes are laid out in an application.
 *
 *   Router(
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   ).renderComponent(document.body);
 *
 * If you don't use JSX, you can also assemble a Router programmatically using the standard
 * JavaScript API for a React component.
 *
 *   Router(
 *     Route({ handler: App },
 *       Route({ name: 'login', handler: Login }),
 *       Route({ name: 'logout', handler: Logout }),
 *       Route({ name: 'about', handler: About })
 *     )
 *   ).renderComponent(document.body);
 *
 * Router "handler" components that contain children can render their active child route
 * using the activeRoute prop in their render method.
 *
 *   var App = React.createClass({
 *     render: function () {
 *       return (
 *         <div class="application">
 *           {this.props.activeRoute}
 *         </div>
 *       );
 *     }
 *   });
 */
function Router(options) {
  // Support Router(<Route>) usage.
  if (React.isValidComponent(options))
    return Router.fromRouteComponent(options);

  // Support Router(options) usage, without new.
  if (!(this instanceof Router))
    return new Router(options);

  options = options || {};

  this.name = options.name;
  this.pattern = path.normalize(options.path || options.name || '/');
  this.handler = options.handler;

  invariant(
    React.isValidComponent(this.handler),
    'Router "' + this.name + '" must have a valid React component for a handler'
  );

  this.displayName = getComponentDisplayName(this.handler) + 'Router';

  // If this router has a name, store it for lookup by <Link> components.
  if (this.name) {
    invariant(
      !_lookupTable[this.name],
      'You cannot use the name "' + this.name + '" for more than one router'
    );

    _lookupTable[this.name] = this;
  }

  // Any other options that were passed in are "static" component props.
  this.staticProps = Route.getUnreservedProps(options);

  this.childRouters = [];
}

var Route = require('./components/route');

/**
 * A convenience method that creates a Router from a <Route> component. This allows
 * you to use JSX to describe your route hierarchy instead of the JavaScript API.
 *
 *   var AppRouter = Router.fromRouteComponent(
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   );
 */
Router.fromRouteComponent = function (routeComponent) {
  invariant(
    routeComponent.type === Route.type,
    'A Router may only be created from <Route> components'
  );

  var router = new Router(routeComponent.props);

  React.Children.forEach(routeComponent.props.children, function (child) {
    router.childRouters.push(Router.fromRouteComponent(child));
  });

  return router;
};

/**
 * Resolves the given string value to a pattern that can be used to match on
 * the URL path. This may be the name of a <Route> or an absolute URL path.
 */
Router.resolveTo = function (to) {
  if (to.charAt(0) === '/')
    return path.normalize(to); // Absolute path.

  var router = _lookupTable[to];

  invariant(
    router,
    'Unable to resolve to "' + to + '". Make sure you have a <Route name="' + to + '">'
  );

  return router.pattern;
};

/**
 * Returns the current path being used in the URL. This is useful if you want to
 * store and transition to it later.
 */
Router.getCurrentPath = function () {
  return urlStore.getCurrentPath();
};

/**
 * Returns a string that is the result of resolving the given "to" value with
 * the given params interpolated and query appended (see Router.resolveTo). The
 * result may safely be used as the href of a link.
 */
Router.makeHref = function (to, params, query) {
  var pattern = Router.resolveTo(to);
  var base = urlStore.getLocation() === 'history' ? '' : '#';
  return base + path.withQuery(path.injectParams(pattern, params), query);
};

/**
 * Initiates a transition to the URL specified by the given arguments (see Router.makeHref).
 */
Router.transitionTo = function (to, params, query) {
  urlStore.push(Router.makeHref(to, params, query));
};

/**
 * Replaces the current URL with the URL specified by the given arguments
 * (see Router.makeHref).
 */
Router.replaceWith = function (to, params, query) {
  urlStore.replace(Router.makeHref(to, params, query));
};

/**
 * Tells the router to use the HTML5 history API for modifying URLs instead of
 * hashes, which is the default. This is opt-in because it requires the server to
 * be configured to serve the same HTML page regardless of the URL.
 */
Router.useHistory = function () {
  urlStore.setup('history');
};

mergeInto(Router.prototype, {

  /**
   * Searches this Router and its subtree depth-first for a Router that matches on
   * the given path. Returns an array of all routes in the tree leading to the one
   * that matched in the format { route, params } where params is an object that
   * contains the URL parameters relevant to that route. Returns null if no Router
   * in the tree matches the path.
   *
   *   var AppRouter = Router(
   *     <Route handler={App}>
   *       <Route name="posts" handler={Posts}>
   *         <Route name="newPost" path="/posts/new" handler={NewPost}/>
   *         <Route name="showPost" path="/posts/:id" handler={Post}/>
   *       </Route>
   *     </Route>
   *   );
   * 
   *   AppRouter.match('/posts/123'); => [ { router: <AppRouter>, params: {} },
   *                                       { router: <PostsRouter>, params: {} },
   *                                       { router: <PostRouter>, params: { id: '123' } } ]
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

        match.unshift(makeMatch(this, params));

        return match;
      }
    }

    // No routes in the subtree matched, so check this route.
    var params = path.extractParams(this.pattern, currentPath);

    if (params)
      return [ makeMatch(this, params) ];

    return null;
  },

  /**
   * Returns a hash of props that should be passed to this router's component
   * given the current URL path.
   */
  getComponentProps: function (currentPath) {
    var match = this.match(path.withoutQuery(currentPath));
    var query = path.extractQuery(currentPath) || {};

    warning(
      !(currentPath && !match),
      'No routes matched path "' + currentPath + '"'
    );

    if (!match)
      return {};

    return match.reduceRight(function (childProps, m) {
      var router = m.router, params = m.params;
      var props = {
        handler: router.handler,
        params: params,
        query: query
      };

      if (router.staticProps)
        mergeInto(props, router.staticProps);

      if (childProps && childProps.handler) {
        props.activeRoute = childProps.handler(childProps);
      } else {
        // Make sure transitioning to the same path with new
        // params causes an update.
        props.key = currentPath;
      }

      return props;
    }, null);
  },

  /**
   * Renders this router's component to the given DOM node and returns a
   * reference to the rendered component.
   */
  renderComponent: function (node) {
    if (!this._component) {
      if (!urlStore.isSetup() && ExecutionEnvironment.canUseDOM)
        urlStore.setup('hash');

      urlStore.addChangeListener(this.handleRouteChange.bind(this));
    }

    var component = this.handler(this.getComponentProps(urlStore.getCurrentPath()));

    this._component = React.renderComponent(component, node);

    return this._component;
  },

  handleRouteChange: function () {
    var currentPath = urlStore.getCurrentPath();

    // TODO: Use route handlers here to determine whether or
    // not the transition should be cancelled.

    this._updateComponentProps(currentPath);
  },

  _updateComponentProps: function (currentPath) {
    this._component.setProps(this.getComponentProps(currentPath));
  },

  toString: function () {
    return '<' + this.displayName + '>';
  }

});

function getComponentDisplayName(component) {
  return component.type.displayName || 'UnnamedComponent';
}

function makeMatch(router, params) {
  return { router: router, params: params };
}

module.exports = Router;
