var PathStore = require('../stores/PathStore');

/**
 * Transitions to the previous URL.
 */
function goBack() {
  PathStore.pop();
}

module.exports = goBack;
