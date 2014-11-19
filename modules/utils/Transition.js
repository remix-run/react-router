var assign = require('react/lib/Object.assign');
var reversedArray = require('./reversedArray');
var Redirect = require('./Redirect');
var Promise = require('./Promise');

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
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Calls callback(error) when finished.
 */
function runTransitionFromHooks(transition, routes, elements, callback) {
  elements = reversedArray(elements);

  var hooks = reversedArray(routes).map(function (route, index) {
    return function () {
      var handler = route.handler;
      var element = elements[index];

      if (!transition.isAborted && handler.willTransitionFrom)
        return handler.willTransitionFrom(transition, element && element.getHandlerElement());

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
function runTransitionToHooks(transition, routes, params, query, callback) {
  var hooks = routes.map(function (route) {
    return function () {
      var handler = route.handler;

      if (!transition.isAborted && handler.willTransitionTo)
        handler.willTransitionTo(transition, params, query);

      var promise = transition.promise;
      delete transition.promise;

      return promise;
    };
  });

  runHooks(hooks, callback);
}

/**
 * Encapsulates a transition to a given path.
 *
 * The willTransitionTo and willTransitionFrom handlers receive
 * an instance of this class as their first argument.
 */
function Transition(path) {
  this.path = path;
  this.abortReason = null;
  this.isAborted = false;
}

assign(Transition.prototype, {

  abort: function (reason) {
    this.abortReason = reason;
    this.isAborted = true;
  },

  redirect: function (to, params, query) {
    this.abort(new Redirect(to, params, query));
  },

  wait: function (value) {
    this.promise = Promise.resolve(value);
  },

  from: function (routes, elements, callback) {
    return runTransitionFromHooks(this, routes, elements, callback);
  },

  to: function (routes, params, query, callback) {
    return runTransitionToHooks(this, routes, params, query, callback);
  },

  retry: function () {
    // TODO
    // this.routesComponent.replaceWith(this.path);
  }

});

module.exports = Transition;
