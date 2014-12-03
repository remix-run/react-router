var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;

/**
 * Returns the current scroll position of the window as { x, y }.
 */
function getWindowScrollPosition() {
  ("production" !== process.env.NODE_ENV ? invariant(
    canUseDOM,
    'Cannot get current scroll position without a DOM'
  ) : invariant(canUseDOM));

  return {
    x: window.scrollX,
    y: window.scrollY
  };
}

module.exports = getWindowScrollPosition;
