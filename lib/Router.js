var React = require('react');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var Promise = require('es6-promise').Promise;
var getComponentDisplayName = require('./helpers/getComponentDisplayName');
var mergeProperties = require('./helpers/mergeProperties');
var reversedArray = require('./helpers/reversedArray');
var ActiveStore = require('./stores/ActiveStore');
var URLStore = require('./stores/URLStore');
var Path = require('./Path');
var Route = require('./Route');

/**
 * A Router specifies components that are rendered to the page when the URL
 * matches a given pattern.
 * 
 * Routes are arranged in a nested tree structure. When a new URL is requested,
 * the tree is searched depth-first to find a route whose path matches the URL.
 * When one is found, all routes in the tree that lead to it are considered
 * "active" and their components are rendered into the DOM, nested in the same
 * order as they are in the tree.
 *
 * Unlike Ember, a nested route's path does not build upon that of its parents.
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
 * Handlers for Route components that contain children can render their active
 * child route using the activeRoute prop.
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
function Router(routeComponent) {
  if (!(this instanceof Router))
    return new Router(routeComponent);

  this.route = Route.fromComponent(routeComponent);
  this.state = {};
  this.components = [];

  this.displayName = getComponentDisplayName(this.route.handler) + 'Router';
}

mergeProperties(Router.prototype, {

  toString: function () {
    return '<' + this.displayName + '>';
  },

  /**
   * Performs a depth-first search for the first route in the tree that matches
   * on the given path. Returns an array of all routes in the tree leading to
   * the one that matched in the format { route, params } where params is an
   * object that contains the URL parameters relevant to that route. Returns
   * null if no route in the tree matches the path.
   *
   *   Router(
   *     <Route handler={App}>
   *       <Route name="posts" handler={Posts}>
   *         <Route name="newPost" path="/posts/new" handler={NewPost}/>
   *         <Route name="showPost" path="/posts/:id" handler={Post}/>
   *       </Route>
   *     </Route>
   *   ).match('/posts/123'); => [ { route: <AppRoute>, params: {} },
   *                               { route: <PostsRoute>, params: {} },
   *                               { route: <PostRoute>, params: { id: '123' } } ]
   */
  match: function (path) {
    return findMatches(Path.withoutQuery(path), this.route);
  },

  /**
   * Performs a transition to the given path and returns a promise for the
   * Transition object that was used.
   *
   * In order to do this, the router first determines which routes are involved
   * in the transition beginning with the current route, up the route tree to
   * the first parent route that is shared with the destination route, and back
   * down the tree to the destination route. The willTransitionFrom static
   * method is invoked on all route handlers we're transitioning away from, in
   * reverse nesting order. Likewise, the willTransitionTo static method
   * is invoked on all route handlers we're transitioning to.
   *
   * Both willTransitionFrom and willTransitionTo hooks may either abort or
   * redirect the transition. If they need to resolve asynchronously, they may
   * return a promise.
   *
   * Any error that occurs asynchronously during the transition is re-thrown in
   * the top-level scope unless returnRejectedPromise is true, in which case a
   * rejected promise is returned so the caller may handle the error.
   *
   * Note: This function does not update the URL in a browser's location bar.
   * If you want to keep the URL in sync with transitions, use Router.transitionTo,
   * Router.replaceWith, or Router.goBack instead.
   */
  dispatch: function (path, returnRejectedPromise) {
    var router = this;
    var matches = router.match(path);

    warning(
      matches,
      'No route matches path "' + path + '". Make sure you have ' +
      'a <Route path="' + path + '"> somewhere in the Router'
    );

    if (!matches)
      matches = [];

    var transition = new Transition(path);

    return syncRouterState(router.state, matches, transition).then(function (newState) {
      if (transition.isCancelled) {
        var reason = transition.cancelReason;

        if (reason instanceof Redirect) {
          Router.replaceWith(reason.to, reason.params, reason.query);
        } else if (reason instanceof Abort) {
          Router.goBack();
        }
      } else if (newState) {
        router.setComponentProps(newState.props);
        ActiveStore.update(newState);
      }

      return transition;
    }).then(undefined, function (error) {
      if (returnRejectedPromise)
        throw error;

      // Use setTimeout to break the promise chain.
      setTimeout(function () {
        router.handleAsyncError(error);
      });
    });
  },

  /**
   * Updates the props of all components that have been rendered by this Router.
   */
  setComponentProps: function (props) {
    this.components.forEach(function (component) {
      component.setProps(props);
    });
  },

  /**
   * Handles errors that occur while transitioning. By default this function
   * simply throws so that errors are not swallowed silently. You should
   * override this function if you want to handle the error.
   */
  handleAsyncError: function (error) {
    throw error; // This error probably originated in a transition hook.
  },

  /**
   * Renders this Router's component into the given container DOM element and
   * returns a reference to the component (i.e. same as React.renderComponent).
   */
  renderComponent: function (container, callback) {
    var route = this.route;
    var state = this.state;
    var components = this.components;

    if (!URLStore.isSetup() && ExecutionEnvironment.canUseDOM)
      URLStore.setup('hash');

    if (!components.length)
      URLStore.addChangeListener(this.handleRouteChange.bind(this));

    var component = React.renderComponent(route.handler(state.props), container, callback);

    if (components.indexOf(component) === -1)
      components.push(component);

    if (!state.props)
      this.dispatch(URLStore.getCurrentPath()); // Bootstrap!

    return component;
  },

  handleRouteChange: function () {
    this.dispatch(URLStore.getCurrentPath());
  }

});

mergeProperties(Router, {

  /**
   * Tells the router to use the HTML5 history API for modifying URLs instead of
   * hashes, which is the default. This is opt-in because it requires the server
   * to be configured to serve the same HTML page regardless of the URL.
   */
  useHistory: function () {
    URLStore.setup('history');
  },

  /**
   * Returns a string that may safely be used as the href of a link to the route
   * with the given name. See Router.makePath.
   */
  makeHref: function (routeName, params, query) {
    var path = Router.makePath(routeName, params, query);

    if (URLStore.getLocation() === 'hash')
      return '#' + path;

    return path;
  },

  /**
   * Returns an absolute URL path created from the given route name, URL
   * parameters, and query values.
   */
  makePath: function (to, params, query) {
    var path;
    if (to.charAt(0) === '/') {
      path = Path.normalize(to); // Absolute path.
    } else {
      var route = Route.getByName(to);

      invariant(
        route,
        'Unable to find a route named "' + to + '". Make sure you have ' +
        'a <Route name="' + to + '"> somewhere in the Router'
      );

      path = route.path;
    }

    return Path.withQuery(Path.injectParams(path, params), query);
  },

  /**
   * Transitions to the URL specified in the arguments by pushing a new URL onto
   * the history stack. See Router.makePath.
   */
  transitionTo: function (to, params, query) {
    URLStore.push(Router.makePath(to, params, query));
  },

  /**
   * Transitions to the URL specified in the arguments by replacing the current
   * URL in the history stack. See Router.makePath.
   */
  replaceWith: function (to, params, query) {
    URLStore.replace(Router.makePath(to, params, query));
  },

  /**
   * Transitions to the previous URL by removing the last entry from the history
   * stack.
   */
  goBack: function () {
    URLStore.back();
  }

});

function Transition(path) {
  this.path = path;
  this.cancelReason = null;
  this.isCancelled = false;
}

mergeProperties(Transition.prototype, {

  abort: function () {
    this.cancelReason = new Abort();
    this.isCancelled = true;
  },

  redirect: function (to, params, query) {
    this.cancelReason = new Redirect(to, params, query);
    this.isCancelled = true;
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

function findMatches(path, route) {
  var childRoutes = route.childRoutes;

  if (childRoutes) {
    // Search the subtree first to find the most deeply-nested route.
    var matches;
    for (var i = 0, length = childRoutes.length; i < length; ++i) {
      matches = findMatches(path, childRoutes[i]);

      if (matches) {
        var rootParams = matches[matches.length - 1].params;
        var params = {};

        route.paramNames.forEach(function (paramName) {
          params[paramName] = rootParams[paramName];
        });

        matches.unshift(makeMatch(route, params));

        return matches;
      }
    }
  }

  // No routes in the subtree matched, so check this route.
  var params = Path.extractParams(route.path, path);

  if (params)
    return [ makeMatch(route, params) ];

  return null;
}

function makeMatch(route, params) {
  return { route: route, params: params };
}

function hasMatch(matches, match) {
  return matches.some(function (m) {
    if (m.route !== match.route)
      return false;

    for (var property in m.params) {
      if (m.params[property] !== match.params[property])
        return false;
    }

    return true;
  });
}

/**
 * Runs all transition hooks that are required to get from the current state
 * to the state specified by the given transition and updates the current state
 * if they all pass successfully. Returns a promise that resolves to the new
 * state if it was updated, or undefined if not.
 */
function syncRouterState(state, nextMatches, transition) {
  if (state.path === transition.path)
    return Promise.resolve(); // Nothing to do!

  var currentMatches = state.matches;

  var fromMatches, toMatches;
  if (currentMatches) {
    fromMatches = currentMatches.filter(function (match) {
      return !hasMatch(nextMatches, match);
    });

    toMatches = nextMatches.filter(function (match) {
      return !hasMatch(currentMatches, match);
    });
  } else {
    fromMatches = [];
    toMatches = nextMatches;
  }

  return checkTransitionFromHooks(fromMatches, transition).then(function () {
    if (transition.isCancelled)
      return; // No need to continue.

    return checkTransitionToHooks(toMatches, transition).then(function () {
      if (transition.isCancelled)
        return; // No need to continue.

      var rootMatch = nextMatches[nextMatches.length - 1];

      state.path = transition.path;
      state.params = (rootMatch && rootMatch.params) || {};
      state.query = Path.extractQuery(state.path) || {};
      state.props = computeProps(nextMatches, state.query);
      state.matches = nextMatches;
      state.routes = nextMatches.map(function (match) {
        return match.route;
      });

      return state;
    });
  });
}

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Returns a promise that resolves after the last handler.
 */
function checkTransitionFromHooks(matches, transition) {
  var promise = Promise.resolve();

  reversedArray(matches).forEach(function (match) {
    promise = promise.then(function () {
      var handler = match.route.handler;

      if (!transition.isCancelled && handler.willTransitionFrom)
        return handler.willTransitionFrom(transition, match.handlerInstance);
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
      var handler = match.route.handler;

      if (!transition.isCancelled && handler.willTransitionTo)
        return handler.willTransitionTo(transition, match.params);
    });
  });

  return promise;
}

/**
 * Returns a props object for a component that renders the routes in the
 * given matches.
 */
function computeProps(matches, query) {
  var props = {
    key: null,
    params: null,
    query: null,
    activeRoute: null
  };

  var previousMatch;
  reversedArray(matches).forEach(function (match) {
    var route = match.route;

    props = {};

    if (route.staticProps)
      mergeProperties(props, route.staticProps);

    props.key = Path.injectParams(route.path, match.params);
    props.params = match.params;
    props.query = query;

    if (previousMatch) {
      props.activeRoute = previousMatch.handlerInstance;
    } else {
      props.activeRoute = null;
    }

    match.handlerInstance = route.handler(props);

    previousMatch = match;
  });

  return props;
}

module.exports = Router;
