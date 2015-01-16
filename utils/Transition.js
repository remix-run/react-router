var assign = require('react/lib/Object.assign');
var Redirect = require('./Redirect');

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Calls callback(error) when finished.
 */
function runTransitionFromHooks(transition, routes, components, callback) {
  var runHooks = routes.reduce(function (callback, route, index) {
    return function (error) {
      if (error || transition.isAborted) {
        callback(error);
      } else if (route.handler.willTransitionFrom) {
        try {
          route.handler.willTransitionFrom(transition, components[index], callback);

          // If there is no callback in the argument list, call it automatically.
          if (route.handler.willTransitionFrom.length < 3)
            callback();
        } catch (e) {
          callback(e);
        }
      } else {
        callback();
      }
    };
  }, callback);

  runHooks();
}

/**
 * Calls the willTransitionTo hook of all handlers in the given matches
 * serially with the transition object and any params that apply to that
 * handler. Calls callback(error) when finished.
 */
function runTransitionToHooks(transition, routes, params, query, callback) {
  var runHooks = routes.reduceRight(function (callback, route) {
    return function (error) {
      if (error || transition.isAborted) {
        callback(error);
      } else if (route.handler.willTransitionTo) {
        try {
          route.handler.willTransitionTo(transition, params, query, callback);

          // If there is no callback in the argument list, call it automatically.
          if (route.handler.willTransitionTo.length < 4)
            callback();
        } catch (e) {
          callback(e);
        }
      } else {
        callback();
      }
    };
  }, callback);

  runHooks();
}

/**
 * Encapsulates a transition to a given path.
 *
 * The willTransitionTo and willTransitionFrom handlers receive
 * an instance of this class as their first argument.
 */
function Transition(path, retry) {
  this.path = path;
  this.abortReason = null;
  this.isAborted = false;
  this.retry = retry.bind(this);
}

assign(Transition.prototype, {

  abort: function (reason) {
    if (this.isAborted) {
      // First abort wins.
      return;
    }

    this.abortReason = reason;
    this.isAborted = true;
  },

  redirect: function (to, params, query) {
    this.abort(new Redirect(to, params, query));
  },

  from: function (routes, components, callback) {
    return runTransitionFromHooks(this, routes, components, callback);
  },

  to: function (routes, params, query, callback) {
    return runTransitionToHooks(this, routes, params, query, callback);
  }

});

module.exports = Transition;
