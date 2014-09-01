var mixInto = require('react/lib/mixInto');
var transitionTo = require('../actions/LocationActions').transitionTo;
var Redirect = require('./Redirect');

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

mixInto(Transition, {

  abort: function (reason) {
    this.abortReason = reason;
    this.isAborted = true;
  },

  redirect: function (to, params, query) {
    this.abort(new Redirect(to, params, query));
  },

  retry: function () {
    transitionTo(this.path);
  }

});

module.exports = Transition;
