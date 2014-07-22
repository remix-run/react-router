var React = require('react');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var emptyFunction = require('react/lib/emptyFunction');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var mergeProperties = require('../helpers/mergeProperties');
var goBack = require('../helpers/goBack');
var replaceWith = require('../helpers/replaceWith');
var transitionTo = require('../helpers/transitionTo');
var withoutProperties = require('../helpers/withoutProperties');
var Path = require('../helpers/Path');
var ActiveStore = require('../stores/ActiveStore');
var RouteStore = require('../stores/RouteStore');
var URLStore = require('../stores/URLStore');
var Promise = require('es6-promise').Promise;

/**
 * A map of <Route> component props that are reserved for use by the
 * router and/or React. All other props are considered "static" and
 * are passed through to the route handler.
 */
var RESERVED_PROPS = {
  location: true,
  handler: true,
  name: true,
  path: true,
  children: true // ReactChildren
};

/**
 * The ref name that can be used to reference the active route component.
 */
var REF_NAME = '__activeRoute__';

/**
 * <Route> components specify components that are rendered to the page when the
 * URL matches a given pattern.
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
 *   React.renderComponent((
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   ), document.body);
 *
 * If you don't use JSX, you can also assemble a Router programmatically using
 * the standard React component JavaScript API.
 *
 *   React.renderComponent((
 *     Route({ handler: App },
 *       Route({ name: 'login', handler: Login }),
 *       Route({ name: 'logout', handler: Logout }),
 *       Route({ name: 'about', handler: About })
 *     )
 *   ), document.body);
 *
 * Handlers for Route components that contain children can render their active
 * child route using the activeRouteHandler prop.
 *
 *   var App = React.createClass({
 *     render: function () {
 *       return (
 *         <div class="application">
 *           {this.props.activeRouteHandler()}
 *         </div>
 *       );
 *     }
 *   });
 */
var Route = React.createClass({
  displayName: 'Route',

  statics: {

    getUnreservedProps: function (props) {
      return withoutProperties(props, RESERVED_PROPS);
    },

    /**
     * Handles errors that were thrown asynchronously. By default, the
     * error is re-thrown so we don't swallow them silently.
     */
    handleAsyncError: function (error, route) {
      throw error; // This error probably originated in a transition hook.
    },

    /**
     * Handles cancelled transitions. By default, redirects replace the
     * current URL and aborts roll it back.
     */
    handleCancelledTransition: function (transition, route) {
      var reason = transition.cancelReason;

      if (reason instanceof Redirect) {
        replaceWith(reason.to, reason.params, reason.query);
      } else if (reason instanceof Abort) {
        goBack();
      }
    }

  },

  propTypes: {
    location: React.PropTypes.oneOf([ 'hash', 'history' ]).isRequired,
    handler: React.PropTypes.any.isRequired,
    path: React.PropTypes.string,
    name: React.PropTypes.string,
  },

  getDefaultProps: function () {
    return {
      location: 'hash'
    };
  },

  getInitialState: function () {
    return {};
  },

  componentWillMount: function () {
    RouteStore.registerRoute(this);

    if (!URLStore.isSetup() && ExecutionEnvironment.canUseDOM)
      URLStore.setup(this.props.location);

    URLStore.addChangeListener(this.handleRouteChange);
  },

  componentDidMount: function () {
    this.dispatch(URLStore.getCurrentPath());
  },

  componentWillUnmount: function () {
    URLStore.removeChangeListener(this.handleRouteChange);
  },

  handleRouteChange: function () {
    this.dispatch(URLStore.getCurrentPath());
  },

  /**
   * Performs a depth-first search for the first route in the tree that matches
   * on the given path. Returns an array of all routes in the tree leading to
   * the one that matched in the format { route, params } where params is an
   * object that contains the URL parameters relevant to that route. Returns
   * null if no route in the tree matches the path.
   *
   *   ( <Route handler={App}>
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
    return findMatches(Path.withoutQuery(path), this);
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
    var transition = new Transition(path);
    var route = this;

    var promise = syncWithTransition(route, transition).then(function (newState) {
      if (transition.isCancelled) {
        Route.handleCancelledTransition(transition, route);
      } else if (newState) {
        ActiveStore.updateState(newState);
      }

      return transition;
    });

    if (!returnRejectedPromise) {
      promise = promise.then(undefined, function (error) {
        // Use setTimeout to break the promise chain.
        setTimeout(function () {
          Route.handleAsyncError(error, route);
        });
      });
    }

    return promise;
  },

  render: function () {
    if (!this.state.path)
      return null;

    return this.props.handler(computeHandlerProps(this.state.matches || [], this.state.activeQuery));
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
    transitionTo(this.path);
  }

});

function Abort() {}

function Redirect(to, params, query) {
  this.to = to;
  this.params = params;
  this.query = query;
}

function findMatches(path, route) {
  var children = route.props.children, matches;

  // Check the subtree first to find the most deeply-nested match.
  if (Array.isArray(children)) {
    for (var i = 0, len = children.length; matches == null && i < len; ++i) {
      matches = findMatches(path, children[i]);
    }
  } else if (children) {
    matches = findMatches(path, children);
  }

  if (matches) {
    var rootParams = getRootMatch(matches).params;
    var params = {};

    Path.extractParamNames(route.props.path).forEach(function (paramName) {
      params[paramName] = rootParams[paramName];
    });

    matches.unshift(makeMatch(route, params));

    return matches;
  }

  // No routes in the subtree matched, so check this route.
  var params = Path.extractParams(route.props.path, path);

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

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

function updateMatchComponents(matches, refs) {
  var i = 0, component;
  while (component = refs[REF_NAME]) {
    matches[i++].component = component;
    refs = component.refs;
  }
}

/**
 * Runs all transition hooks that are required to get from the current state
 * to the state specified by the given transition and updates the current state
 * if they all pass successfully. Returns a promise that resolves to the new
 * state if it needs to be updated, or undefined if not.
 */
function syncWithTransition(route, transition) {
  if (route.state.path === transition.path)
    return Promise.resolve(); // Nothing to do!

  var currentMatches = route.state.matches;
  var nextMatches = route.match(transition.path);

  warning(
    nextMatches,
    'No route matches path "' + transition.path + '". Make sure you have ' +
    '<Route path="' + transition.path + '"> somewhere in your routes'
  );

  if (!nextMatches)
    nextMatches = [];

  var fromMatches, toMatches;
  if (currentMatches) {
    updateMatchComponents(currentMatches, route.refs);

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

      var rootMatch = getRootMatch(nextMatches);
      var params = (rootMatch && rootMatch.params) || {};
      var query = Path.extractQuery(transition.path) || {};
      var state = {
        path: transition.path,
        matches: nextMatches,
        activeParams: params,
        activeQuery: query,
        activeRoutes: nextMatches.map(function (match) {
          return match.route;
        })
      };

      route.setState(state);

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
      var handler = match.route.props.handler;

      if (!transition.isCancelled && handler.willTransitionFrom)
        return handler.willTransitionFrom(transition, match.component);
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
      var handler = match.route.props.handler;

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
function computeHandlerProps(matches, query) {
  var props = {
    ref: null,
    key: null,
    params: null,
    query: null,
    activeRouteHandler: emptyFunction.thatReturnsNull
  };

  var childHandler;
  reversedArray(matches).forEach(function (match) {
    var route = match.route;

    props = Route.getUnreservedProps(route.props);

    props.ref = REF_NAME;
    props.key = Path.injectParams(route.props.path, match.params);
    props.params = match.params;
    props.query = query;

    if (childHandler) {
      props.activeRouteHandler = childHandler;
    } else {
      props.activeRouteHandler = emptyFunction.thatReturnsNull;
    }

    childHandler = function (props, addedProps) {
      if (arguments.length > 2 && typeof arguments[2] !== 'undefined')
        throw new Error('Passing children to a route handler is not supported');

      return route.props.handler.apply(null, mergeProperties(props, addedProps));
    }.bind(this, props);
  });

  return props;
}

function reversedArray(array) {
  return array.slice(0).reverse();
}

module.exports = Route;
