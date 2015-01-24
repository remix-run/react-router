/* jshint -W058 */
var assign = require('react/lib/Object.assign');
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
  this.retry = retry.bind(this);
}

assign(Transition.prototype, {

  abort: function (reason) {
    if (this.abortReason == null)
      this.abortReason = reason || 'ABORT';
  },

  redirect: function (to, params, query) {
    this.abort(new Redirect(to, params, query));
  },

  from: function (routes, components, callback) {
    var self = this;

    var runHooks = routes.reduce(function (callback, route, index) {
      return function (error) {
        if (error || self.abortReason) {
          callback(error);
        } else if (route.handler.willTransitionFrom) {
          try {
            route.handler.willTransitionFrom(self, components[index], callback);

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
  },

  to: function (routes, params, query, callback) {
    var self = this;

    var runHooks = routes.reduceRight(function (callback, route) {
      return function (error) {
        if (error || self.abortReason) {
          callback(error);
        } else if (route.handler.willTransitionTo) {
          try {
            route.handler.willTransitionTo(self, params, query, callback);

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

});

module.exports = Transition;
