var React = require('react');
var warning = require('react/lib/warning');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var copyProperties = require('react/lib/copyProperties');
var Route = require('../components/Route');
var ActiveDelegate = require('./ActiveDelegate');
var PathDelegate = require('./PathDelegate');
var ScrollDelegate = require('./ScrollDelegate');
var reversedArray = require('../utils/reversedArray');
var Transition = require('../utils/Transition');
var Redirect = require('../utils/Redirect');
var Path = require('../utils/Path');

function makeMatch(route, params) {
  return { route: route, params: params };
}

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

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

function hasMatch(matches, match) {
  return matches.some(function (m) {
    if (m.route !== match.route)
      return false;

    for (var property in m.params)
      if (m.params[property] !== match.params[property])
        return false;

    return true;
  });
}

function updateMatchComponents(matches, refs) {
  var i = 0, component;
  while (component = refs.__activeRoute__) {
    matches[i++].component = component;
    refs = component.refs;
  }
}

/**
 * Computes the next state for the given component and calls
 * callback(error, nextState) when finished. Also runs all
 * transition hooks along the way.
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

      var matches = currentMatches.slice(0, currentMatches.length - fromMatches.length).concat(toMatches);
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

function returnNull() {
  return null;
}

function computeHandlerProps(matches, query) {
  var handler = returnNull;
  var props = {
    ref: null,
    params: null,
    query: null,
    activeRouteHandler: handler,
    key: null
  };

  reversedArray(matches).forEach(function (match) {
    var route = match.route;

    props = Route.getUnreservedProps(route.props);

    props.ref = '__activeRoute__';
    props.params = match.params;
    props.query = query;
    props.activeRouteHandler = handler;

    // TODO: Can we remove addHandlerKey?
    if (route.props.addHandlerKey)
      props.key = Path.injectParams(route.props.path, match.params);

    handler = function (props, addedProps) {
      if (arguments.length > 2 && typeof arguments[2] !== 'undefined')
        throw new Error('Passing children to a route handler is not supported');

      return route.props.handler(
        copyProperties(props, addedProps)
      );
    }.bind(this, props);
  });

  return props;
}

var BrowserTransitionHandling = {

  /**
   * Handles errors that were thrown asynchronously while transitioning. The
   * default behavior is to re-throw the error so it isn't swallowed silently.
   */
  handleTransitionError: function (error) {
    throw error; // This error probably originated in a transition hook.
  },

  /**
   * Handles aborted transitions.
   */
  handleAbortedTransition: function (transition) {
    var reason = transition.abortReason;

    if (reason instanceof Redirect) {
      this.replaceWith(reason.to, reason.params, reason.query);
    } else {
      this.goBack();
    }
  }

};

var ServerTransitionHandling = {

  handleTransitionError: function (error) {
    // TODO
  },

  handleAbortedTransition: function (transition) {
    var reason = transition.abortReason;

    if (reason instanceof Redirect) {
      // TODO
    } else {
      // TODO
    }
  }

};

var TransitionHandling = canUseDOM ? BrowserTransitionHandling : ServerTransitionHandling;

/**
 * A mixin for components that handle transitions.
 */
var TransitionHandler = {

  mixins: [ ActiveDelegate, PathDelegate, ScrollDelegate ],

  propTypes: {
    onTransitionError: React.PropTypes.func.isRequired,
    onAbortedTransition: React.PropTypes.func.isRequired
  },

  getDefaultProps: function () {
    return {
      onTransitionError: TransitionHandling.handleTransitionError,
      onAbortedTransition: TransitionHandling.handleAbortedTransition
    };
  },

  getInitialState: function () {
    return {
      matches: []
    };
  },

  /**
   * See PathState.
   */
  updatePath: function (path, actionType) {
    if (this.state.path === path)
      return; // Nothing to do!

    if (this.state.path)
      this.recordScroll(this.state.path);

    var self = this;

    this.dispatch(path, function (error, transition) {
      if (error) {
        self.props.onTransitionError.call(self, error);
      } else if (transition.isAborted) {
        self.props.onAbortedTransition.call(self, transition);
      } else {
        self.emitChange();
        self.updateScroll(path, actionType);
      }
    });
  },

  /**
   * Performs a depth-first search for the first route in the tree that matches on
   * the given path. Returns an array of all routes in the tree leading to the one
   * that matched in the format { route, params } where params is an object that
   * contains the URL parameters relevant to that route. Returns null if no route
   * in the tree matches the path.
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
    return findMatches(Path.withoutQuery(path), this.getRoutes(), this.props.defaultRoute, this.props.notFoundRoute);
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
   */
  dispatch: function (path, callback) {
    var transition = new Transition(this, path);
    var self = this;

    computeNextState(this, transition, function (error, nextState) {
      if (error || nextState == null)
        return callback(error, transition);

      self.setState(nextState, function () {
        callback(null, transition);
      });
    });
  },

  /**
   * Returns the props that should be used for the top-level route handler.
   */
  getHandlerProps: function () {
    return computeHandlerProps(this.state.matches, this.state.activeQuery);
  },

  /**
   * Returns a reference to the active route handler's component instance.
   */
  getActiveRoute: function () {
    return this.refs.__activeRoute__;
  }

};

module.exports = TransitionHandler;
