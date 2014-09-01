var invariant = require('react/lib/invariant');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var getWindowPath = require('../utils/getWindowPath');

var _onChange;

/**
 * A Location that uses HTML5 history.
 */
var HistoryLocation = {

  setup: function (onChange) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'You cannot use HistoryLocation in an environment with no DOM'
    );

    _onChange = onChange;

    if (window.addEventListener) {
      window.addEventListener('popstate', _onChange, false);
    } else {
      window.attachEvent('popstate', _onChange);
    }
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', _onChange, false);
    } else {
      window.detachEvent('popstate', _onChange);
    }
  },

  push: function (path) {
    window.history.pushState({ path: path }, '', path);
    _onChange();
  },

  replace: function (path) {
    window.history.replaceState({ path: path }, '', path);
    _onChange();
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
