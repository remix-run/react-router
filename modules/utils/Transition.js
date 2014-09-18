var mixInto = require('react/lib/mixInto');
var Redirect = require('./Redirect');
var replaceWith = require('../actions/LocationActions').replaceWith;

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
    replaceWith(this.path);
  }

});

module.exports = Transition;
