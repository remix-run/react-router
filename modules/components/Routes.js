var React = require('react');
var warning = require('react/lib/warning');
var copyProperties = require('react/lib/copyProperties');
var Promise = require('when/lib/Promise');
var LocationActions = require('../actions/LocationActions');
var Route = require('../components/Route');
var Path = require('../utils/Path');
var Redirect = require('../utils/Redirect');
var Transition = require('../utils/Transition');
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var ActiveStore = require('../stores/ActiveStore');
var PathStore = require('../stores/PathStore');
var RouteStore = require('../stores/RouteStore');

/**
 * The ref name that can be used to reference the active route component.
 */
var REF_NAME = '__activeRoute__';

/**
 * A hash of { name, location } pairs of all locations.
 */
var NAMED_LOCATIONS = {
  hash: HashLocation,
  history: HistoryLocation,
  refresh: RefreshLocation
};

/**
 * The default handler for aborted transitions. Redirects replace
 * the current URL and all others roll it back.
 */
function defaultAbortedTransitionHandler(transition) {
  var reason = transition.abortReason;

  if (reason instanceof Redirect) {
    LocationActions.replaceWith(reason.to, reason.params, reason.query);
  } else {
    LocationActions.goBack();
  }
}

/**
 * The default handler for active state updates.
 */
function defaultActiveStateChangeHandler(state) {
  ActiveStore.updateState(state);
}

/**
 * The default handler for errors that were thrown asynchronously
 * while transitioning. The default behavior is to re-throw the
 * error so that it isn't silently swallowed.
 */
function defaultTransitionErrorHandler(error) {
  throw error; // This error probably originated in a transition hook.
}

function maybeUpdateScroll(routes, rootRoute) {
  if (!routes.props.preserveScrollPosition && !rootRoute.props.preserveScrollPosition)
    LocationActions.updateScroll();
}

/**
 * The <Routes> component configures the route hierarchy and renders the
 * route matching the current location when rendered into a document.
 *
 * See the <Route> component for more details.
 */
var Routes = React.createClass({

  displayName: 'Routes',

  propTypes: {
    onAbortedTransition: React.PropTypes.func.isRequired,
    onActiveStateChange: React.PropTypes.func.isRequired,
    onTransitionError: React.PropTypes.func.isRequired,
    preserveScrollPosition: React.PropTypes.bool,
    location: function (props, propName, componentName) {
      var location = props[propName];

      if (typeof location === 'string' && !(location in NAMED_LOCATIONS))
        return new Error('Unknown location "' + location + '", see ' + componentName);
    }
  },

  getDefaultProps: function () {
    return {
      onAbortedTransition: defaultAbortedTransitionHandler,
      onActiveStateChange: defaultActiveStateChangeHandler,
      onTransitionError: defaultTransitionErrorHandler,
      preserveScrollPosition: false,
      location: HashLocation
    };
  },

  getInitialState: function () {
    return {
      routes: RouteStore.registerChildren(this.props.children, this)
    };
  },

  getLocation: function () {
    var location = this.props.location;

    if (typeof location === 'string')
      return NAMED_LOCATIONS[location];

    return location;
  },

  componentWillMount: function () {
    PathStore.setup(this.getLocation());
    PathStore.addChangeListener(this.handlePathChange);
  },

  componentDidMount: function () {
    this.handlePathChange();
  },

  componentWillUnmount: function () {
    PathStore.removeChangeListener(this.handlePathChange);
  },

  handlePathChange: function () {
    this.dispatch(PathStore.getCurrentPath());
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
    var routes = this;

    var promise = runTransitionHooks(routes, transition).then(function (nextState) {
      if (transition.isAborted) {
        routes.props.onAbortedTransition(transition);
      } else if (nextState) {
        routes.setState(nextState);
        routes.props.onActiveStateChange(nextState);

        // TODO: add functional test
        var rootMatch = getRootMatch(nextState.matches);

        if (rootMatch)
          maybeUpdateScroll(routes, rootMatch.route);
      }

      return transition;
    });

    if (!returnRejectedPromise) {
      promise = promise.then(undefined, function (error) {
        // Use setTimeout to break the promise chain.
        setTimeout(function () {
          routes.props.onTransitionError(error);
        });
      });
    }

    return promise;
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
 * Runs all transition hooks that are required to get from the current state
 * to the state specified by the given transition and updates the current state
 * if they all pass successfully. Returns a promise that resolves to the new
 * state if it needs to be updated, or undefined if not.
 */
function runTransitionHooks(routes, transition) {
  if (routes.state.path === transition.path)
    return Promise.resolve(); // Nothing to do!

  var currentMatches = routes.state.matches;
  var nextMatches = routes.match(transition.path);

  warning(
    nextMatches,
    'No route matches path "' + transition.path + '". Make sure you have ' +
    '<Route path="' + transition.path + '"> somewhere in your routes'
  );

  if (!nextMatches)
    nextMatches = [];

  var fromMatches, toMatches;
  if (currentMatches) {
    updateMatchComponents(currentMatches, routes.refs);

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

  return runTransitionFromHooks(fromMatches, transition).then(function () {
    if (transition.isAborted)
      return; // No need to continue.

    return runTransitionToHooks(toMatches, transition, query).then(function () {
      if (transition.isAborted)
        return; // No need to continue.

      var rootMatch = getRootMatch(nextMatches);
      var params = (rootMatch && rootMatch.params) || {};

      return {
        path: transition.path,
        matches: nextMatches,
        activeParams: params,
        activeQuery: query,
        activeRoutes: nextMatches.map(function (match) {
          return match.route;
        })
      };
    });
  });
}

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Returns a promise that resolves after the last handler.
 */
function runTransitionFromHooks(matches, transition) {
  var promise = Promise.resolve();

  reversedArray(matches).forEach(function (match) {
    promise = promise.then(function () {
      var handler = match.route.props.handler;

      if (!transition.isAborted && handler.willTransitionFrom)
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
function runTransitionToHooks(matches, transition, query) {
  var promise = Promise.resolve();

  matches.forEach(function (match) {
    promise = promise.then(function () {
      var handler = match.route.props.handler;

      if (!transition.isAborted && handler.willTransitionTo)
        return handler.willTransitionTo(transition, match.params, query);
    });
  });

  return promise;
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
