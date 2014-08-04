var React = require('react');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var mergeProperties = require('../helpers/mergeProperties');
var goBack = require('../helpers/goBack');
var replaceWith = require('../helpers/replaceWith');
var transitionTo = require('../helpers/transitionTo');
var Route = require('../components/Route');
var Path = require('../helpers/Path');
var ActiveStore = require('../stores/ActiveStore');
var RouteStore = require('../stores/RouteStore');
var URLStore = require('../stores/URLStore');
var Promise = require('es6-promise').Promise;

/**
 * The ref name that can be used to reference the active route component.
 */
var REF_NAME = '__activeRoute__';

/**
 * The <Routes> component configures the route hierarchy and renders the
 * route matching the current location when rendered into a document.
 *
 * See the <Route> component for more details.
 */
var Routes = React.createClass({
  displayName: 'Routes',

  statics: {

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
    handleCancelledTransition: function (transition, routes) {
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
    preserveScrollPosition: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      location: 'hash',
      preserveScrollPosition: false
    };
  },

  getInitialState: function () {
    return {};
  },

  componentWillMount: function () {
    React.Children.forEach(this.props.children, function (child) {
      RouteStore.registerRoute(child);
    });

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
    var rootRoutes = this.props.children;
    if (!Array.isArray(rootRoutes)) {
      rootRoutes = [rootRoutes];
    }
    var matches = null;
    for (var i = 0; matches == null && i < rootRoutes.length; i++) {
      matches = findMatches(Path.withoutQuery(path), rootRoutes[i]);
    }
    return matches;
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

    var promise = syncWithTransition(routes, transition).then(function (newState) {
      if (transition.isCancelled) {
        Routes.handleCancelledTransition(transition, routes);
      } else if (newState) {
        ActiveStore.updateState(newState);
      }

      return transition;
    });

    if (!returnRejectedPromise) {
      promise = promise.then(undefined, function (error) {
        // Use setTimeout to break the promise chain.
        setTimeout(function () {
          Routes.handleAsyncError(error, routes);
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
  var params;

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
    params = {};

    Path.extractParamNames(route.props.path).forEach(function (paramName) {
      params[paramName] = rootParams[paramName];
    });

    matches.unshift(makeMatch(route, params));

    return matches;
  }

  // No routes in the subtree matched, so check this route.
  params = Path.extractParams(route.props.path, path);

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
function syncWithTransition(routes, transition) {
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

      // TODO: add functional test
      maybeScrollWindow(routes, toMatches[toMatches.length - 1]);
      routes.setState(state);

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

  matches.forEach(function (match) {
    promise = promise.then(function () {
      var handler = match.route.props.handler;

      if (!transition.isCancelled && handler.willTransitionTo)
        return handler.willTransitionTo(transition, match.params);
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
    props.key = Path.injectParams(route.props.path, match.params);
    props.params = match.params;
    props.query = query;

    if (childHandler) {
      props.activeRouteHandler = childHandler;
    } else {
      props.activeRouteHandler = returnNull;
    }

    childHandler = function (props, addedProps) {
      if (arguments.length > 2 && typeof arguments[2] !== 'undefined')
        throw new Error('Passing children to a route handler is not supported');

      return route.props.handler(mergeProperties(props, addedProps));
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

function maybeScrollWindow(routes, match) {
  if (routes.props.preserveScrollPosition)
    return;

  if (!match || match.route.props.preserveScrollPosition)
    return;

  window.scrollTo(0, 0);
}

module.exports = Routes;
