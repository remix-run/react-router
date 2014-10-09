var React = require('react');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var copyProperties = require('react/lib/copyProperties');
var HashLocation = require('../locations/HashLocation');
var reversedArray = require('../utils/reversedArray');
var Transition = require('../utils/Transition');
var Redirect = require('../utils/Redirect');
var Path = require('../utils/Path');
var Route = require('./Route');

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

function updateMatchComponents(matches, refs) {
  var i = 0, component;
  while (component = refs.__activeRoute__) {
    matches[i++].component = component;
    refs = component.refs;
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

var ActiveContext = require('../mixins/ActiveContext');
var LocationContext = require('../mixins/LocationContext');
var RouteContext = require('../mixins/RouteContext');
var ScrollContext = require('../mixins/ScrollContext');

/**
 * The <Routes> component configures the route hierarchy and renders the
 * route matching the current location when rendered into a document.
 *
 * See the <Route> component for more details.
 */
var Routes = React.createClass({

  displayName: 'Routes',

  mixins: [ ActiveContext, LocationContext, RouteContext, ScrollContext ],

  propTypes: {
    onChange: React.PropTypes.func,
    onError: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      matches: []
    };
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

  updateLocation: function (path, actionType) {
    if (this.state.path === path)
      return; // Nothing to do!

    if (this.state.path)
      this.recordScroll(this.state.path);

    this.dispatch(path, actionType, function (error, abortReason) {
      if (error) {
        if (this.props.onError) {
          this.props.onError.call(this, error);
        } else {
          // Throw so we don't silently swallow errors.
          throw error; // This error probably originated in a transition hook.
        }
      } else if (abortReason instanceof Redirect) {
        this.replaceWith(abortReason.to, abortReason.params, abortReason.query);
      } else if (abortReason) {
        this.goBack();
      } else {
        updateMatchComponents(this.state.matches, this.refs);

        this.updateScroll(path, actionType);

        if (this.props.onChange)
          this.props.onChange.call(this);
      }
    }.bind(this));
  },

  /**
   * Performs a transition to the given path and calls callback(error, abortReason)
   * when the transition is finished and the component's state has been updated. If
   * there was an error, the first argument will not be null. Otherwise, if the
   * transition was aborted for some reason, it will be given in the second arg.
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

    computeNextState(this, transition, function (error, nextState) {
      if (error || transition.isAborted || nextState == null)
        return callback(error, transition.abortReason);

      this.setState(nextState, callback);
    }.bind(this));
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
  getActiveComponent: function () {
    return this.refs.__activeRoute__;
  },

  /**
   * Returns the current URL path.
   */
  getCurrentPath: function () {
    return this.state.path;
  },

  /**
   * Returns an absolute URL path created from the given route
   * name, URL parameters, and query values.
   */
  makePath: function (to, params, query) {
    var path;
    if (Path.isAbsolute(to)) {
      path = Path.normalize(to);
    } else {
      var namedRoutes = this.getNamedRoutes();
      var route = namedRoutes[to];

      invariant(
        route,
        'Unable to find a route named "' + to + '". Make sure you have ' +
        'a <Route name="' + to + '"> defined somewhere in your <Routes>'
      );

      path = route.props.path;
    }

    return Path.withQuery(Path.injectParams(path, params), query);
  },

  /**
   * Returns a string that may safely be used as the href of a
   * link to the route with the given name.
   */
  makeHref: function (to, params, query) {
    var path = this.makePath(to, params, query);

    if (this.getLocation() === HashLocation)
      return '#' + path;

    return path;
  },

    /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query) {
    var location = this.getLocation();

    invariant(
      location,
      'You cannot use transitionTo without a location'
    );

    location.push(this.makePath(to, params, query));
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query) {
    var location = this.getLocation();

    invariant(
      location,
      'You cannot use replaceWith without a location'
    );

    location.replace(this.makePath(to, params, query));
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    var location = this.getLocation();

    invariant(
      location,
      'You cannot use goBack without a location'
    );

    location.pop();
  },

  render: function () {
    var match = this.state.matches[0];

    if (match == null)
      return null;

    return match.route.props.handler(
      this.getHandlerProps()
    );
  },

  childContextTypes: {
    currentPath: React.PropTypes.string,
    makePath: React.PropTypes.func.isRequired,
    makeHref: React.PropTypes.func.isRequired,
    transitionTo: React.PropTypes.func.isRequired,
    replaceWith: React.PropTypes.func.isRequired,
    goBack: React.PropTypes.func.isRequired
  },

  getChildContext: function () {
    return {
      currentPath: this.getCurrentPath(),
      makePath: this.makePath,
      makeHref: this.makeHref,
      transitionTo: this.transitionTo,
      replaceWith: this.replaceWith,
      goBack: this.goBack
    };
  }

});

module.exports = Routes;
