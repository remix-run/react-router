var Promise = require('./Promise');
var Redirect = require('./Redirect');

/**
 * Encapsulates a transition to a given path.
 *
 * The willTransitionTo and willTransitionFrom handlers receive
 * an instance of this class as their first argument.
 */
function Transition(routesComponent, path) {
  this.routesComponent = routesComponent;
  this.path = path;
  this.abortReason = null;
  this.isAborted = false;
}

Transition.prototype = {

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

  retry: function () {
    this.routesComponent.replaceWith(this.path);
  }

};

module.exports = Transition;
