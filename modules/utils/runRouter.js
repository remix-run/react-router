var React = require('react');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var supportsHistory = require('./supportsHistory');
var Redirect = require('./Redirect');

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
