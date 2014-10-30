var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;

/**
 * Returns the current URL path from `window.location`, including query string
 */
function getWindowPath() {
  invariant(
    canUseDOM,
    'Cannot get current path without a DOM'
  );

  return window.location.pathname + window.location.search;
}

module.exports = getWindowPath;
