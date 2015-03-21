/* jshint -W058 */

var Cancellation = require('./Cancellation');
var Redirect = require('./Redirect');

/**
 * Encapsulates a transition to a given path.
 *
 * The willTransitionTo and willTransitionFrom handlers receive
 * an instance of this class as their first argument.
 */
function Transition(path, retry) {
  this.path = path;
  this.abortReason = null;
  // TODO: Change this to router.retryTransition(transition)
  this.retry = retry.bind(this);
}

Transition.prototype.abort = function (reason) {
  if (this.abortReason == null)
    this.abortReason = reason || 'ABORT';
};

Transition.prototype.redirect = function (to, params, query) {
  this.abort(new Redirect(to, params, query));
};

Transition.prototype.cancel = function () {
  this.abort(new Cancellation);
};

Transition.from = function (transition, routes, components, callback) {
  routes.reduce(function (callback, route, index) {
    return function (error) {
      if (error || transition.abortReason) {
        callback(error);
      } else if (route.onLeave) {
        if (route.onLeave.length > 2) {
          route.onLeave(transition, components[index], callback);
        } else {
          // Catch errors if there is no callback in the argument list.
          var err = null;
          try {
            route.onLeave(transition, components[index]);
          } catch (e) {
            err = e;
          }
          callback(err);
        }
      } else {
        callback();
      }
    };
  }, callback)();
};

Transition.to = function (transition, routes, params, query, callback) {
  routes.reduceRight(function (callback, route) {
    return function (error) {
      if (error || transition.abortReason) {
        callback(error);
      } else if (route.onEnter) {
        if (route.onEnter.length > 3) {
          route.onEnter(transition, params, query, callback);
        } else {
          // Catch errors if there is no callback in the argument list.
          var err = null;
          try {
            route.onEnter(transition, params, query);
          } catch (e) {
            err = e;
          }
          callback(err);
        }
      } else {
        callback();
      }
    };
  }, callback)();
};

module.exports = Transition;
