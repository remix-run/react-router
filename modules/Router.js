var React = require('react');
var assign = require('react/lib/Object.assign');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var createRoutesFromChildren = require('./utils/createRoutesFromChildren');
var Transition = require('./utils/Transition');
var reversedArray = require('./utils/reversedArray');
var runRouter = require('./utils/runRouter');
var Match = require('./utils/Match');
var Path = require('./utils/Path');
var HashLocation = require('./locations/HashLocation');
var HistoryLocation = require('./locations/HistoryLocation');
var supportsHistory = require('./utils/supportsHistory');

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

function findMatches(path, routes, defaultRoute, notFoundRoute) {
  var matches = null, route, params;

  for (var i = 0, len = routes.length; i < len; ++i) {
    route = routes[i];

    // Check the subtree first to find the most deeply-nested match.
    matches = findMatches(path, route.childRoutes, route.defaultRoute, route.notFoundRoute);

    if (matches != null) {
      var rootParams = getRootMatch(matches).params;

      params = route.paramNames.reduce(function (params, paramName) {
        params[paramName] = rootParams[paramName];
        return params;
      }, {});

      matches.unshift(new Match(route, params));

      return matches;
    }

    // No routes in the subtree matched, so check this route.
    params = Path.extractParams(route.path, path);

    if (params)
      return [ new Match(route, params) ];
  }

  // No routes matched, so try the default route if there is one.
  if (defaultRoute && (params = Path.extractParams(defaultRoute.path, path)))
    return [ new Match(defaultRoute, params) ];

  // Last attempt: does the "not found" route match?
  if (notFoundRoute && (params = Path.extractParams(notFoundRoute.path, path)))
    return [ new Match(notFoundRoute, params) ];

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

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Calls callback(error) when finished.
 */
function runTransitionFromHooks(router, matches, transition, callback) {
  var hooks = reversedArray(matches).map(function (match, index) {
    return function () {
      var handler = match.route.handler;

      if (!transition.isAborted && handler.willTransitionFrom) {
        var component = router.activeRefs[matches.length - 1 - index];
        return handler.willTransitionFrom(transition, component);
      }

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
      var handler = match.route.handler;

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

function defaultErrorHandler(error) {
  // Throw so we don't silently swallow async errors.
  throw error; // This error probably originated in a transition hook.
}

/**
 * A Router is a container for a set of routes and state.
 */
function Router(routes, onError, onAbort) {
  this.defaultRoute = null;
  this.notFoundRoute = null;
  this.routes = createRoutesFromChildren(routes, this, this.namedRoutes = {});
  this.onError = onError || defaultErrorHandler;
  this.onAbort = onAbort;
  this.activeRefs = [];
  this.state = {};
}

assign(Router.prototype, {

  /**
   * Returns an absolute URL path created from the given route
   * name, URL parameters, and query.
   */
  makePath: function (to, params, query) {
    var path;
    if (Path.isAbsolute(to)) {
      path = Path.normalize(to);
    } else {
      var route = this.namedRoutes[to];

      invariant(
        route,
        'Unable to find a <Route> with name="%s"',
        to
      );

      path = route.path;
    }

    return Path.withQuery(Path.injectParams(path, params), query);
  },

  /**
   * Performs a depth-first search for the first route in the tree that matches on
   * the given path. Returns an array of Match objects leading to the route that
   * matched, ordered by depth in the component hierarchy. Returns null if no route
   * in the tree matched the path.
   *
   *   new Router(
   *     <Route handler={App}>
   *       <Route name="posts" handler={Posts}/>
   *       <Route name="post" path="/posts/:id" handler={Post}/>
   *     </Route>
   *   ).match('/posts/123'); => [ { route: <AppRoute>, params: {} },
   *                               { route: <PostRoute>, params: { id: '123' } } ]
   */
  match: function (path) {
    return findMatches(Path.withoutQuery(path), this.routes, this.defaultRoute, this.notFoundRoute);
  },

  /**
   * Performs a transition to the given path and calls callback(error, abortReason)
   * when the transition is finished. If both arguments are null the router's state
   * was updated. Otherwise the transition did not complete.
   *
   * In a transition, a router first determines which routes are involved by beginning
   * with the current route, up the route tree to the first parent route that is shared
   * with the destination route, and back down the tree to the destination route. The
   * willTransitionFrom hook is invoked on all route handlers we're transitioning away
   * from, in reverse nesting order. Likewise, the willTransitionTo hook is invoked on
   * all route handlers we're transitioning to.
   *
   * Both willTransitionFrom and willTransitionTo hooks may either abort or redirect the
   * transition. To resolve asynchronously, they may use transition.wait(promise). If no
   * hooks wait, the transition is fully synchronous.
   */
  dispatch: function (path, callback) {
    var transition = new Transition(this, path);
    var currentMatches = this.state.matches || [];
    var nextMatches = this.match(path) || [];

    warning(
      nextMatches.length,
      'No route matches path "%s". Make sure you have <Route path="%s"> somewhere in your <Routes>',
      path, path
    );

    var fromMatches, toMatches;
    if (currentMatches.length) {
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

    var router = this;
    var query = Path.extractQuery(path) || {};

    runTransitionFromHooks(router, fromMatches, transition, function (error) {
      if (error || transition.isAborted)
        return callback.call(router, error, transition.abortReason);

      runTransitionToHooks(toMatches, transition, query, function (error) {
        if (error || transition.isAborted)
          return callback.call(router, error, transition.abortReason);

        var matches = currentMatches.slice(0, currentMatches.length - fromMatches.length).concat(toMatches);
        var rootMatch = getRootMatch(matches);
        var params = (rootMatch && rootMatch.params) || {};
        var routes = matches.map(function (match) {
          return match.route;
        });

        router._nextState = {
          path: path,
          matches: matches,
          activeRoutes: routes,
          activeParams: params,
          activeQuery: query
        };

        callback.call(router);
      });
    });
  },

  registerRef: function (ref, index) {
    if (index != null)
      this.activeRefs[index] = ref;
    else
      index = this.activeRefs.push(ref) - 1;
    return index;
  },

  unregisterRef: function (index) {
    activeRefs.splice(index, 1);
  },

  flipSwitch: function () {
    this.state = this._nextState;
    delete this._nextState;
  }

});

/**
 * Runs a router (or an array of Route objects) using the given location and
 * calls callback(Handler, state) when finished. The Handler is a React class
 * that should be used at the root of the component hierarchy. The state argument
 * is the current state of the router.
 *
 * Using `window.location.hash` to manage the URL, you could do:
 *
 *   Router.run(routes, function (Handler) {
 *     React.render(<Handler/>, document.body);
 *   });
 * 
 * Using HTML5 history and a custom "cursor" prop:
 * 
 *   Router.run(routes, Router.HistoryLocation, function (Handler) {
 *     React.render(<Handler cursor={cursor}/>, document.body);
 *   });
 */
Router.run = function (router, location, callback) {
  if (typeof location === 'function') {
    callback = location;
    location = HashLocation;
  }

  // Automatically fall back to full page refreshes in
  // browsers that do not support HTML5 history.
  if (location === HistoryLocation && !supportsHistory())
    location = RefreshLocation;

  runRouter(
    router instanceof Router ? router : new Router(router),
    location, callback
  );
};

module.exports = Router;
