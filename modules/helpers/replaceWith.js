var URLStore = require('../stores/URLStore');
var makePath = require('./makePath');

/**
 * Transitions to the URL specified in the arguments by replacing
 * the current URL in the history stack.
 */
function replaceWith(to, params, query) {
  URLStore.replace(makePath(to, params, query));
}

module.exports = replaceWith;
