var React = require('react');
var assign = require('react/lib/Object.assign');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var supportsHistory = require('./supportsHistory');
var Redirect = require('./Redirect');
var Match = require('./Match');
var Route = require('./Route');
var Path = require('./Path');

/**
 * Returns a React class that can be used to render the current state of
 * the given Router.
 */
function createRouteHandlerClass(router, location) {
  var state = router.state;

  return React.createClass({

    displayName: 'RouteHandler',

    contextTypes: {
      matches: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Match)).isRequired,

      // Router.CurrentPath
      path: React.PropTypes.string.isRequired,

      // Router.ActiveState
      activeRoutes: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Route)).isRequired,
      activeParams: React.PropTypes.object.isRequired,
      activeQuery: React.PropTypes.object.isRequired,
      isActive: React.PropTypes.func.isRequired,

      // Router.Navigation
      makePath: React.PropTypes.func.isRequired,
      makeHref: React.PropTypes.func.isRequired,
      transitionTo: React.PropTypes.func.isRequired,
      replaceWith: React.PropTypes.func.isRequired,
      goBack: React.PropTypes.func.isRequired
    },

    getChildContext: function () {
      return assign({}, state, {
        isActive: this.isActive,
        makePath: this.makePath,
        makeHref: this.makeHref,
        transitionTo: this.transitionTo,
        replaceWith: this.replaceWith,
        goBack: this.goBack
      });
    },

    propTypes: {
      children: function () {
        return new Error('You cannot pass children to a RouteHandler');
      }
    },

    /**
     * Returns true if the given route, params, and query are active.
     */
    isActive: function (to, params, query) {
      if (Path.isAbsolute(to))
        return to === state.path;

      return routeIsActive(state.activeRoutes, to) &&
        paramsAreActive(state.activeParams, params) &&
        (query == null || queryIsActive(state.activeQuery, query));
    },

    /**
     * Returns an absolute URL path created from the given route
     * name, URL parameters, and query.
     */
    makePath: function (to, params, query) {
      var path;
      if (Path.isAbsolute(to)) {
        path = Path.normalize(to);
      } else {
        var route = router.namedRoutes[to];

        invariant(
          route,
          'Unable to find a <Route> with name="%s"',
          to
        );

        path = route.props.path;
      }

      return Path.withQuery(Path.injectParams(path, params), query);
    },

    /**
     * Returns a string that may safely be used as the href of a link
     * to the route with the given name, URL parameters, and query.
     */
    makeHref: function (to, params, query) {
      var path = this.makePath(to, params, query);
      return (location === HashLocation) ? '#' + path : path;
    },

    /**
     * Transitions to the URL specified in the arguments by pushing
     * a new URL onto the history stack.
     */
    transitionTo: function (to, params, query) {
      invariant(
        typeof location !== 'string',
        'You cannot use transitionTo with a static location'
      );

      location.push(this.makePath(to, params, query));
    },

    /**
     * Transitions to the URL specified in the arguments by replacing
     * the current URL in the history stack.
     */
    replaceWith: function (to, params, query) {
      invariant(
        typeof location !== 'string',
        'You cannot use replaceWith with a static location'
      );

      location.replace(this.makePath(to, params, query));
    },

    /**
     * Transitions to the previous URL.
     */
    goBack: function () {
      invariant(
        typeof location !== 'string',
        'You cannot use goBack with a static location'
      );

      location.pop();
    },

    render: function () {
      var route = state.activeRoutes[0];
      return route ? route.handler(this.props) : null;
    }

  });
}

function defaultStaticAbortHandler(abortReason) {
  throw new Error('Unhandled aborted transition! Reason: ' + abortReason);
}

function createDynamicAbortHandler(router, location) {
  return function (abortReason) {
    if (abortReason instanceof Redirect) {
      location.replace(router.makePath(abortReason.to, abortReason.params, abortReason.query));
    } else {
      location.pop();
    }
  };
}

var _changeHandlers = [];
var _lastChange;

function locationChangeHandler(change) {
  var i = 0;

  while (i < _changeHandlers.length)
    _changeHandlers[i++].call(this, change);

  _lastChange = change;
}

var _currentLocation;

/**
 * Runs a router using the given location and calls callback(Handler, state)
 * when the route changes. If the location is static (i.e. a URL path in a web
 * server environment) the callback is only called once. Otherwise, the location
 * should be one of the Router.*Location objects (e.g. Router.HashLocation or
 * Router.HistoryLocation).
 */ 
function runRouter(router, location, callback) {
  if (typeof location === 'function') {
    callback = location;
    location = HashLocation;
  }

  // Automatically fall back to full page refreshes in
  // browsers that do not support HTML5 history.
  if (location === HistoryLocation && !supportsHistory())
    location = RefreshLocation;

  var onAbort;
  function dispatchHandler(error, abortReason) {
    if (error) {
      router.onError(error);
    } else if (abortReason) {
      onAbort.call(router, abortReason);
    } else {
      callback(
        createRouteHandlerClass(router, location), router.state
      );
    }
  }

  if (typeof location === 'string') {
    warning(
      !canUseDOM,
      'You should not use a static location in a DOM environment because ' +
      'the router will not be kept in sync with the current URL'
    );

    onAbort = router.onAbort || defaultStaticAbortHandler;

    // Dispatch the location.
    router.dispatch(location, dispatchHandler);
  } else {
    invariant(
      canUseDOM,
      'You cannot use %s in a non-DOM environment',
      location
    );

    invariant(
      _currentLocation == null || _currentLocation === location,
      'You are already using %s. You cannot use %s on the same page',
      _currentLocation, location
    );

    // Setup the location if it needs it.
    if (_currentLocation !== location) {
      _currentLocation = location;

      if (location.setup)
        location.setup(locationChangeHandler);
    }

    // Listen for changes to the location.
    function changeHandler(change) {
      if (router.state.path !== change.path)
        router.dispatch(change.path, dispatchHandler);
    }

    _changeHandlers.push(changeHandler);

    onAbort = router.onAbort || createDynamicAbortHandler(router, location);

    // Bootstrap using the most recent location change
    // or the current path if there is none.
    router.dispatch(
      _lastChange ? _lastChange.path : location.getCurrentPath(),
      dispatchHandler
    );
  }
}

module.exports = runRouter;
