var React = require('react');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var RefreshLocation = require('../locations/RefreshLocation');
var createRouteHandler = require('./createRouteHandler');
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

/**
 * Runs a router using the given location and calls callback(Handler, state)
 * when the route changes. If the location is static (i.e. a URL path in a web
 * server environment) the callback is only called once. Otherwise, the location
 * should be one of the Router.*Location objects (e.g. Router.HashLocation or
 * Router.HistoryLocation).
 */ 
function runRouter(router, location, callback) {
  var Handler = createRouteHandler(router, location);
  var onAbort;

  function dispatchHandler(error, abortReason) {
    if (error) {
      router.onError(error);
    } else if (abortReason) {
      onAbort.call(router, abortReason);
    } else {
      callback(Handler, router._nextState);
    }
  }

  if (typeof location === 'string') {
    warning(
      !canUseDOM || process.env.NODE_ENV === 'test',
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

    // Listen for changes to the location.
    function changeListener(change) {
      if (router.state.path !== change.path)
        router.dispatch(change.path, dispatchHandler);
    }

    if (location.addChangeListener)
      location.addChangeListener(changeListener);

    onAbort = router.onAbort || createDynamicAbortHandler(router, location);

    // Bootstrap using the current path.
    router.dispatch(
      location.getCurrentPath(),
      dispatchHandler
    );
  }
}

module.exports = runRouter;
