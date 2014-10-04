/**
 * Returns the current URL path from `window.location`, including query string
 */
function getWindowPath() {
  return window.location.pathname + window.location.search;
}

module.exports = getWindowPath;
