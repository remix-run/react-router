'use strict';

exports.__esModule = true;
exports.runEnterHooks = runEnterHooks;
exports.runLeaveHooks = runLeaveHooks;

var _AsyncUtils = require('./AsyncUtils');

function createEnterHook(hook, route) {
  return function (a, b, callback) {
    hook.apply(route, arguments);

    if (hook.length < 3) {
      // Assume hook executes synchronously and
      // automatically call the callback.
      callback();
    }
  };
}

function getEnterHooks(routes) {
  return routes.reduce(function (hooks, route) {
    if (route.onEnter) hooks.push(createEnterHook(route.onEnter, route));

    return hooks;
  }, []);
}

/**
 * Runs all onEnter hooks in the given array of routes in order
 * with onEnter(nextState, replaceState, callback) and calls
 * callback(error, redirectInfo) when finished. The first hook
 * to use replaceState short-circuits the loop.
 *
 * If a hook needs to run asynchronously, it may use the callback
 * function. However, doing so will cause the transition to pause,
 * which could lead to a non-responsive UI if the hook is slow.
 */

function runEnterHooks(routes, nextState, callback) {
  var hooks = getEnterHooks(routes);

  if (!hooks.length) {
    callback();
    return;
  }

  var redirectInfo = undefined;
  function replaceState(state, pathname, query) {
    redirectInfo = { pathname: pathname, query: query, state: state };
  }

  _AsyncUtils.loopAsync(hooks.length, function (index, next, done) {
    hooks[index](nextState, replaceState, function (error) {
      if (error || redirectInfo) {
        done(error, redirectInfo); // No need to continue.
      } else {
          next();
        }
    });
  }, callback);
}

/**
 * Runs all onLeave hooks in the given array of routes in order.
 */

function runLeaveHooks(routes) {
  for (var i = 0, len = routes.length; i < len; ++i) {
    if (routes[i].onLeave) routes[i].onLeave.call(routes[i]);
  }
}