var React = require('react');
var warning = require('react/lib/warning');
var copyProperties = require('react/lib/copyProperties');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var Route = require('../components/Route');
var ActiveDelegate = require('../mixins/ActiveDelegate');
var PathListener = require('../mixins/PathListener');
var RouteStore = require('../stores/RouteStore');
var ScrollStore = require('../stores/ScrollStore');
var Path = require('../utils/Path');
var Promise = require('../utils/Promise');
var Redirect = require('../utils/Redirect');
var Transition = require('../utils/Transition');

/**
 * The ref name that can be used to reference the active route component.
 */
var REF_NAME = '__activeRoute__';

/**
 * The default handler for aborted transitions. Redirects replace
 * the current URL and all others roll it back.
 */
function defaultAbortedTransitionHandler(transition) {
  if (!canUseDOM)
    return;

  var reason = transition.abortReason;

  if (reason instanceof Redirect) {
    LocationActions.replaceWith(reason.to, reason.params, reason.query);
  } else {
    LocationActions.goBack();
  }
}

/**
 * The default handler for errors that were thrown asynchronously
 * while transitioning. The default behavior is to re-throw the
 * error so that it isn't silently swallowed.
 */
function defaultTransitionErrorHandler(error) {
  throw error; // This error probably originated in a transition hook.
}

/**
 * Updates the window's scroll position given the current route.
 */
function maybeUpdateScroll(routes) {
  if (!canUseDOM)
    return;

  var currentRoute = routes.getCurrentRoute();
  var scrollPosition = ScrollStore.getScrollPosition();

  if (currentRoute && scrollPosition) {
    window.scrollTo(scrollPosition.x, scrollPosition.y);
  }
}

/**
 * The <Routes> component configures the route hierarchy and renders the
 * route matching the current location when rendered into a document.
 *
 * See the <Route> component for more details.
 */
var Routes = React.createClass({

  displayName: 'Routes',

  mixins: [ ActiveDelegate, PathListener ],

  propTypes: {
    onAbortedTransition: React.PropTypes.func.isRequired,
    onTransitionError: React.PropTypes.func.isRequired
  },

  getDefaultProps: function () {
    return {
      onAbortedTransition: defaultAbortedTransitionHandler,
      onTransitionError: defaultTransitionErrorHandler
    };
  },

  getInitialState: function () {
    return {
      matches: [],
      routes: RouteStore.registerChildren(this.props.children, this)
    };
  },

  /**
   * Gets the <Route> component that is currently active.
   */
  getCurrentRoute: function () {
    var rootMatch = getRootMatch(this.state.matches);
    return rootMatch && rootMatch.route;
  },

  /**
   * Performs a depth-first search for the first route in the tree that matches
   * on the given path. Returns an array of all routes in the tree leading to
   * the one that matched in the format { route, params } where params is an
   * object that contains the URL parameters relevant to that route. Returns
   * null if no route in the tree matches the path.
   *
   *   React.renderComponent(
   *     <Routes>
   *       <Route handler={App}>
   *         <Route name="posts" handler={Posts}/>
   *         <Route name="post" path="/posts/:id" handler={Post}/>
   *       </Route>
   *     </Routes>
   *   ).match('/posts/123'); => [ { route: <AppRoute>, params: {} },
   *                               { route: <PostRoute>, params: { id: '123' } } ]
   */
  match: function (path) {
    return findMatches(Path.withoutQuery(path), this.state.routes, this.props.defaultRoute, this.props.notFoundRoute);
  },

  updatePath: function (path) {
    var self = this;

    this.dispatch(path, function (error, transition) {
      if (error) {
        self.props.onTransitionError(error);
      } else if (transition.isAborted) {
        self.props.onAbortedTransition(transition);
      } else {
        self.emitChange();
        maybeUpdateScroll(self);
      }
    });
  },

  /**
   * Performs a transition to the given path and calls callback(error, transition)
   * with the Transition object when the transition is finished and the component's
   * state has been updated accordingly.
   *
   * In a transition, the router first determines which routes are involved by
   * beginning with the current route, up the route tree to the first parent route
   * that is shared with the destination route, and back down the tree to the
   * destination route. The willTransitionFrom hook is invoked on all route handlers
   * we're transitioning away from, in reverse nesting order. Likewise, the
   * willTransitionTo hook is invoked on all route handlers we're transitioning to.
   *
   * Both willTransitionFrom and willTransitionTo hooks may either abort or redirect
   * the transition. To resolve asynchronously, they may use transition.wait(promise).
   *
   * Note: This function does not update the URL in a browser's location bar.
   */
  dispatch: function (path, callback) {
    var transition = new Transition(path);
    var self = this;

    computeNextState(this, transition, function (error, nextState) {
      if (error || nextState == null)
        return callback(error, transition);

      self.setState(nextState, function () {
        callback(null, transition);
      });
    });
  },

  render: function () {
    if (!this.state.path)
      return null;

    var matches = this.state.matches;
    if (matches.length) {
      // matches[0] corresponds to the top-most match
      return matches[0].route.props.handler(computeHandlerProps(matches, this.state.activeQuery));
    } else {
      return null;
    }
  }

});

function findMatches(path, routes, defaultRoute, notFoundRoute) {
  var matches = null, route, params;

  for (var i = 0, len = routes.length; i < len; ++i) {
    route = routes[i];

    // Check the subtree first to find the most deeply-nested match.
    matches = findMatches(path, route.props.children, route.props.defaultRoute, route.props.notFoundRoute);

    if (matches != null) {
      var rootParams = getRootMatch(matches).params;
      
      params = route.props.paramNames.reduce(function (params, paramName) {
        params[paramName] = rootParams[paramName];
        return params;
      }, {});

      matches.unshift(makeMatch(route, params));

      return matches;
    }

    // No routes in the subtree matched, so check this route.
    params = Path.extractParams(route.props.path, path);

    if (params)
      return [ makeMatch(route, params) ];
  }

  // No routes matched, so try the default route if there is one.
  if (defaultRoute && (params = Path.extractParams(defaultRoute.props.path, path)))
    return [ makeMatch(defaultRoute, params) ];

  // Last attempt: does the "not found" route match?
  if (notFoundRoute && (params = Path.extractParams(notFoundRoute.props.path, path)))
    return [ makeMatch(notFoundRoute, params) ];

  return matches;
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
 * Computes the next state for the given <Routes> component and calls
 * callback(error, nextState) when finished. Also runs all transition
 * hooks along the way.
 */
function computeNextState(component, transition, callback) {
  if (component.state.path === transition.path)
    return callback(); // Nothing to do!

  var currentMatches = component.state.matches;
  var nextMatches = component.match(transition.path);

  warning(
    nextMatches,
    'No route matches path "' + transition.path + '". Make sure you have ' +
    '<Route path="' + transition.path + '"> somewhere in your routes'
  );

  if (!nextMatches)
    nextMatches = [];

  var fromMatches, toMatches;
  if (currentMatches.length) {
    updateMatchComponents(currentMatches, component.refs);

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

  var query = Path.extractQuery(transition.path) || {};

  runTransitionFromHooks(fromMatches, transition, function (error) {
    if (error || transition.isAborted)
      return callback(error);

    runTransitionToHooks(toMatches, transition, query, function (error) {
      if (error || transition.isAborted)
        return callback(error);

      var matches = currentMatches.slice(0, -fromMatches.length).concat(toMatches);
      var rootMatch = getRootMatch(matches);
      var params = (rootMatch && rootMatch.params) || {};
      var routes = matches.map(function (match) {
        return match.route;
      });

      callback(null, {
        path: transition.path,
        matches: matches,
        activeRoutes: routes,
        activeParams: params,
        activeQuery: query
      });
    });
  });
}

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Calls callback(error) when finished.
 */
function runTransitionFromHooks(matches, transition, callback) {
  var hooks = reversedArray(matches).map(function (match) {
    return function () {
      var handler = match.route.props.handler;

      if (!transition.isAborted && handler.willTransitionFrom)
        return handler.willTransitionFrom(transition, match.component);

      var promise = transition.promise;
      delete transition.promise;

      return promise;
    };
  });

  runHooks(hooks, callback);
}

/**
 * Calls the willTransitionTo hook of all handlers in the given matches
 * serially with the transition object and any params that apply to that
 * handler. Calls callback(error) when finished.
 */
function runTransitionToHooks(matches, transition, query, callback) {
  var hooks = matches.map(function (match) {
    return function () {
      var handler = match.route.props.handler;

      if (!transition.isAborted && handler.willTransitionTo)
        handler.willTransitionTo(transition, match.params, query);

      var promise = transition.promise;
      delete transition.promise;

      return promise;
    };
  });

  runHooks(hooks, callback);
}

/**
 * Runs all hook functions serially and calls callback(error) when finished.
 * A hook may return a promise if it needs to execute asynchronously.
 */
function runHooks(hooks, callback) {
  try {
    var promise = hooks.reduce(function (promise, hook) {
      // The first hook to use transition.wait makes the rest
      // of the transition async from that point forward.
      return promise ? promise.then(hook) : hook();
    }, null);
  } catch (error) {
    return callback(error); // Sync error.
  }

  if (promise) {
    // Use setTimeout to break the promise chain.
    promise.then(function () {
      setTimeout(callback);
    }, function (error) {
      setTimeout(function () {
        callback(error);
      });
    });
  } else {
    callback();
  }
}

/**
 * Given an array of matches as returned by findMatches, return a descriptor for
 * the handler hierarchy specified by the route.
 */
function computeHandlerProps(matches, query) {
  var props = {
    ref: null,
    key: null,
    params: null,
    query: null,
    activeRouteHandler: returnNull
  };

  var childHandler;
  reversedArray(matches).forEach(function (match) {
    var route = match.route;

    props = Route.getUnreservedProps(route.props);

    props.ref = REF_NAME;
    props.params = match.params;
    props.query = query;

    if (route.props.addHandlerKey)
      props.key = Path.injectParams(route.props.path, match.params);

    if (childHandler) {
      props.activeRouteHandler = childHandler;
    } else {
      props.activeRouteHandler = returnNull;
    }

    childHandler = function (props, addedProps) {
      if (arguments.length > 2 && typeof arguments[2] !== 'undefined')
        throw new Error('Passing children to a route handler is not supported');

      return route.props.handler(copyProperties(props, addedProps));
    }.bind(this, props);
  });

  return props;
}

function returnNull() {
  return null;
}

function reversedArray(array) {
  return array.slice(0).reverse();
}

module.exports = Routes;
