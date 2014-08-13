var PathStore = require('../stores/PathStore');
var makePath = require('./makePath');

/**
 * Transitions to the URL specified in the arguments by pushing
 * a new URL onto the history stack.
 */
function transitionTo(to, params, query) {
  PathStore.push(makePath(to, params, query));
}

module.exports = transitionTo;
