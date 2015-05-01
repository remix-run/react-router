/**
 * Returns the current URL path.
 */
function getWindowPath() {
  return decodeURI(
    window.location.pathname + window.location.search
  );
}

/**
 * Returns the URL path contained in the hash portion of the URL,
 * which HashHistory uses to store the current path.
 */
function getHashPath() {
  return decodeURI(
    // We can't use window.location.hash here because it's not
    // consistent across browsers - Firefox will pre-decode it!
    window.location.href.split('#')[1] || ''
  );
}

/**
 * Returns the current scroll position of the window as { x, y }.
 */
function getWindowScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
}

module.exports = {
  getWindowPath,
  getHashPath,
  getWindowScrollPosition
};
