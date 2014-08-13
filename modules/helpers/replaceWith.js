var PathStore = require('../stores/PathStore');
var makePath = require('./makePath');

/**
 * Transitions to the URL specified in the arguments by replacing
 * the current URL in the history stack.
 */
function replaceWith(to, params, query) {
  PathStore.replace(makePath(to, params, query));
}

module.exports = replaceWith;
