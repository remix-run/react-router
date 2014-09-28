var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var getWindowPath = require('../utils/getWindowPath');

var _onPop;

/**
 * A Location that uses HTML5 history.
 */
var HistoryLocation = {

  setup: function (onPop) {
    invariant(
      canUseDOM,
      'You cannot use HistoryLocation in an environment with no DOM'
    );

    _onPop = onPop;

    if (window.addEventListener) {
      window.addEventListener('popstate', _onPop, false);
    } else {
      window.attachEvent('popstate', _onPop);
    }
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', _onPop, false);
    } else {
      window.detachEvent('popstate', _onPop);
    }
  },

  push: function (path) {
    window.history.pushState({ path: path }, '', path);
  },

  replace: function (path) {
    window.history.replaceState({ path: path }, '', path);
  },

  pop: function () {
    window.history.back();
  },

  getCurrentPath: getWindowPath,

  toString: function () {
    return '<HistoryLocation>';
  }

};

module.exports = HistoryLocation;
