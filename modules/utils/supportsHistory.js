function supportsHistory() {
  /*! taken from modernizr
   * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
   */
  var ua = navigator.userAgent;
  if ((ua.indexOf('Android 2.') !== -1 ||
      (ua.indexOf('Android 4.0') !== -1)) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1) {
    return false;
  }

  try {
    // TODO: better way to use replaceState that doesn't actually change the current url?
    var path = window.location.pathname + window.location.search;
    window.history.replaceState({path: path}, '', path);
  }
  catch (e) {
    return false;
  }

  return (window.history && 'pushState' in window.history);
}

module.exports = supportsHistory;
