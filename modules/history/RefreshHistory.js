/* jshint -W058 */
var assign = require('react/lib/Object.assign');
var warning = require('react/lib/warning');
var { getWindowPath } = require('../DOMUtils');
var DOMHistory = require('./DOMHistory');

/**
 * A history implementation that can be used in DOM environments
 * that lack support for HTML5 history. Automatically used as the
 * fallback when HTML5 history is desired but not available.
 */
var RefreshHistory = assign(new DOMHistory, {

  getCurrentPath: getWindowPath,

  push(path) {
    window.location = path;
  },

  replace(path) {
    window.location.replace(path);
  },

  canGo(n) {
    warning(
      false,
      'RefreshHistory.canGo(n) is not reliable'
    );

    return DOMHistory.prototype.canGo.call(this, n);
  }

});

module.exports = RefreshHistory;
