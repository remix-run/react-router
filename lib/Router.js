var React = require('react');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var emptyFunction = require('react/lib/emptyFunction');
var Promise = require('es6-promise').Promise;
var mergeProperties = require('./helpers/mergeProperties');
var hasProperties = require('./helpers/hasProperties');
var URLStore = require('./stores/URLStore');
var Route = require('./components/Route');
var Path = require('./Path');

var _lookupTable = {};

/**
 * A Router specifies a component that will be rendered to the page when the URL
 * matches a given pattern. Routers may also be named, which makes it easy for
 * <Link> components to link to them.
 * 
 * Routers are arranged in a nested tree structure. When a new URL is requested,
 * the tree is searched depth-first to find a route whose path matches the URL.
 * When one is found, all routes in the tree that lead to it are considered
 * "active" and their components are rendered into the DOM, nested in the same
 * order as they are in the tree.
 *
 * Unlike Ember, a nested router's path does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URLs, but it
 * has the nice benefit of decoupling nested UI from "nested" URLs.
 *
 * The preferred way to configure a router is using JSX. The XML-like syntax is
 * a great way to visualize how routes are laid out in an application.
 *
 *   Router(
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   ).renderComponent(document.body);
 *
 * If you don't use JSX, you can also assemble a Router programmatically using
 * the standard React component JavaScript API.
 *
 *   Router(
 *     Route({ handler: App },
 *       Route({ name: 'login', handler: Login }),
 *       Route({ name: 'logout', handler: Logout }),
 *       Route({ name: 'about', handler: About })
 *     )
 *   ).renderComponent(document.body);
 *
 * Router "handler" components that contain children can render their active
 * child route using the activeRoute prop in their render method.
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
  this.path = Path.normalize(options.path || options.name || '/');
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

  this.currentHandlerInstance = null;
  this.childRouters = [];
}

mergeProperties(Router.prototype, {

  /**
   * Searches this Router and its subtree depth-first for a Router that matches
   * on the given path. Returns an array of all routes in the tree leading to
   * the one that matched in the format { route, params } where params is an
   * object that contains the URL parameters relevant to that route. Returns
   * null if no Router in the tree matches the path.
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

        var paramNames = Path.extractParamNames(this.path);
        var params = {};

        paramNames.forEach(function (paramName) {
          // Ensure the child route contains all dynamic segments in this route. 
          // TODO: We should probably do this when routes are first declared.
          invariant(
            rootParams[paramName],
            'Router path "' + rootRouter.path + '" does not contain all parameters ' +
            'of its ancestor path "' + this.path + '", so they cannot be nested'
          );

          params[paramName] = rootParams[paramName];
        });

        match.unshift(makeMatch(this, params));

        return match;
      }
    }

    // No routes in the subtree matched, so check this route.
    var params = Path.extractParams(this.path, currentPath);

    if (params)
      return [ makeMatch(this, params) ];

    return null;
  },

  /**
   * Renders this router's component to the given DOM node and returns a
   * reference to the rendered component.
   */
  renderComponent: function (node) {
    invariant(
      !this._component,
      'Rendering the same router multiple times is not supported'
    );

    this._component = React.renderComponent(this.handler(), node);

    Router.wasRendered(this);

    return this._component;
  },

  toString: function () {
    return '<' + this.displayName + '>';
  }

});

var _renderedRouters = [];

mergeProperties(Router, {

  /**
   * A convenience method that creates a Router from a <Route> component.
   *
   *   var AppRouter = Router.fromRouteComponent(
   *     <Route handler={App}>
   *       <Route name="login" handler={Login}/>
   *       <Route name="logout" handler={Logout}/>
   *       <Route name="about" handler={About}/>
   *     </Route>
   *   );
   */
  fromRouteComponent: function (routeComponent) {
    invariant(
      routeComponent.type === Route.type,
      'A Router may only be created from <Route> components'
    );

    var router = new Router(routeComponent.props);

    React.Children.forEach(routeComponent.props.children, function (child) {
      router.childRouters.push(Router.fromRouteComponent(child));
    });

    return router;
  },

  /**
   * Resolves the given string value to a pattern that can be used to match on
   * the URL path. This may be the name of a <Route> or an absolute URL path.
   */
  resolveTo: function (to) {
    if (to.charAt(0) === '/')
      return Path.normalize(to); // Absolute path.

    var router = _lookupTable[to];

    invariant(
      router,
      'Unable to resolve to "' + to + '". Make sure you have a <Route name="' + to + '">'
    );

    return router.path;
  },

  /**
   * Returns a string that is the result of resolving the given "to" value with
   * the given params interpolated and query appended (see Router.resolveTo). The
   * result may safely be used as the href of a link.
   */
  makeHref: function (to, params, query) {
    var href = Path.withQuery(Path.injectParams(Router.resolveTo(to), params), query);

    if (URLStore.getLocation() === 'hash')
      return '#' + href;

    return href;
  },

  /**
   * Returns the current path being used in the URL. This is useful if you want to
   * store and transition to it later.
   */
  getCurrentPath: function () {
    return URLStore.getCurrentPath();
  },

  /**
   * Initiates a transition to the URL specified by the given arguments (see
   * Router.makeHref).
   */
  transitionTo: function (to, params, query) {
    URLStore.push(Router.makeHref(to, params, query));
  },

  /**
   * Replaces the current URL with the URL specified by the given arguments (see
   * Router.makeHref).
   */
  replaceWith: function (to, params, query) {
    URLStore.replace(Router.makeHref(to, params, query));
  },

  /**
   * Tells the router to use the HTML5 history API for modifying URLs instead of
   * hashes, which is the default. This is opt-in because it requires the server
   * to be configured to serve the same HTML page regardless of the URL.
   */
  useHistory: function () {
    URLStore.setup('history');
  },

  wasRendered: function (router) {
    if (!_renderedRouters.length) {
      if (!URLStore.isSetup() && ExecutionEnvironment.canUseDOM)
        URLStore.setup('hash');

      URLStore.addChangeListener(Router.handleRouteChange);
    }

    _renderedRouters.push(router);

    Router.dispatch(URLStore.getCurrentPath(), [ router ]);
  },

  handleRouteChange: function () {
    Router.dispatch(URLStore.getCurrentPath(), _renderedRouters.slice(0));
  },

  /**
   * Tells the given routers to sync with the URL. This is performed in two steps:
   *
   * 1) All routers run the transition hooks they need to get from their current
   *    state to the destination. Any router has the ability to abort/redirect
   *    the transition inside these hooks.
   * 2) After all transition hooks have run, if the transition has not been
   *    cancelled, all routers sync with the URL. If it has been cancelled, the
   *    URL is updated accordingly.
   */
  dispatch: function (path, routers) {
    var transition = new Transition(path);
    var promises = routers.map(function (router) {
      return computeChanges(router, transition);
    });

    Promise.all(promises).then(function (routerChanges) {
      if (transition.isCancelled()) {
        Router.handleCancelledTransition(transition);
      } else {
        routerChanges.forEach(function (changes, index) {
          var router = routers[index];

          warning(
            changes,
            'Router ' + router + ' does not match path "' + path + '", ignoring path change'
          );

          if (changes)
            changes.apply(router);
        });
      }
    }).then(undefined, function (error) {
      setTimeout(function () {
        Router.handleAsyncError(error);
      });
    });
  },

  handleAsyncError: function (error) {
    throw error; // This error probably originated in a transition hook.
  },

  handleCancelledTransition: function (transition) {
    var reason = transition.cancelReason;

    if (reason instanceof Redirect) {
      Router.replaceWith(reason.to, reason.params, reason.query);
    } else if (reason instanceof Abort) {
      URLStore.back();
    }
  }

});

function Transition(path) {
  this.path = path;
  this.cancelReason = null;
}

mergeProperties(Transition.prototype, {

  isCancelled: function () {
    return this.cancelReason != null;
  },

  abort: function () {
    this.cancelReason = new Abort();
  },

  redirect: function (to, params, query) {
    this.cancelReason = new Redirect(to, params, query);
  },

  retry: function () {
    Router.transitionTo(this.path);
  }

});

function Abort() {}

function Redirect(to, params, query) {
  this.to = to;
  this.params = params;
  this.query = query;
}

function getComponentDisplayName(component) {
  return component.type.displayName || 'UnnamedComponent';
}

function makeMatch(router, params) {
  return { router: router, params: params };
}

function hasMatch(matches, match) {
  return matches.some(function (m) {
    return match.router === m.router && hasProperties(match.params, m.params);
  });
}

/**
 * Computes and returns a promise for a function that can be applied to the
 * given router to synchronize its state with the transition.
 */
function computeChanges(router, transition) {
  if (router._currentPath === transition.path)
    return Promise.resolve(emptyFunction); // Nothing to do!

  var lastMatches = router._currentState;
  var nextMatches = router.match(Path.withoutQuery(transition.path));

  if (!nextMatches)
    return null;

  var fromMatches, toMatches;
  if (lastMatches) {
    fromMatches = lastMatches.filter(function (match) {
      return !hasMatch(nextMatches, match);
    });

    toMatches = nextMatches.filter(function (match) {
      return !hasMatch(lastMatches, match);
    });
  } else {
    fromMatches = [];
    toMatches = nextMatches;
  }

  return checkTransitionFromHooks(fromMatches, transition).then(function () {
    if (transition.isCancelled())
      return null; // No need to continue.

    return checkTransitionToHooks(toMatches, transition).then(function () {
      if (transition.isCancelled())
        return null; // No need to continue.

      return function () {
        invariant(
          router._currentState === lastMatches,
          'Changes for router ' + router + ' are out of sync with its current state'
        );

        router._currentPath = transition.path;
        router._currentState = nextMatches;

        fromMatches.forEach(function (match) {
          match.router.currentHandlerInstance = null;
        });

        if (router._component)
          router._component.setProps(computeProps(nextMatches, transition.path));
      };
    });
  });
}

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse, so that the deepest nested handlers are called first.
 * Returns a promise that resolves after the last handler.
 */
function checkTransitionFromHooks(matches, transition) {
  var promise = Promise.resolve();

  reversedArray(matches).forEach(function (match) {
    promise = promise.then(function () {
      var router = match.router;
      var handler = router.handler;

      if (!transition.isCancelled() && handler.willTransitionFrom)
        return handler.willTransitionFrom(transition, router.currentHandlerInstance);
    });
  });

  return promise;
}

/**
 * Calls the willTransitionTo hook of all handlers in the given matches serially
 * with the transition object and any params that apply to that handler. Returns
 * a promise that resolves after the last handler.
 */
function checkTransitionToHooks(matches, transition) {
  var promise = Promise.resolve();

  matches.forEach(function (match, index) {
    promise = promise.then(function () {
      var handler = match.router.handler;

      if (!transition.isCancelled() && handler.willTransitionTo)
        return handler.willTransitionTo(transition, match.params);
    });
  });

  return promise;
}

/**
 * Returns a props object for a router component that displays the routes in the
 * given matches.
 */
function computeProps(matches, path) {
  var query = (path && Path.extractQuery(path)) || {};
  var props, lastRouter;

  reversedArray(matches).forEach(function (match) {
    var router = match.router;

    props = {};

    if (router.staticProps)
      mergeProperties(props, router.staticProps);

    props.key = Path.injectParams(router.path, match.params);
    props.params = match.params;
    props.query = query;

    if (lastRouter) {
      props.activeRoute = lastRouter.currentHandlerInstance;
    } else {
      props.activeRoute = null;
    }

    router.currentHandlerInstance = router.handler(props);

    lastRouter = router;
  });

  return props;
}

function reversedArray(array) {
  return array.slice(0).reverse();
}

module.exports = Router;
