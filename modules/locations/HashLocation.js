var invariant = require('react/lib/invariant');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var getWindowPath = require('../helpers/getWindowPath');

var _onChange;

/**
 * Location handler that uses `window.location.hash`.
 */
var HashLocation = {

  setup: function (onChange) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'You cannot use HashLocation in an environment with no DOM'
    );

    _onChange = onChange;

    // Make sure the hash is at least / to begin with.
    if (window.location.hash === '')
      window.location.replace(getWindowPath() + '#/');

    if (window.addEventListener) {
      window.addEventListener('hashchange', _onChange, false);
    } else {
      window.attachEvent('onhashchange', _onChange);
    }
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('hashchange', _onChange, false);
    } else {
      window.detachEvent('onhashchange', _onChange);
    }
  },

  push: function (path) {
    window.location.hash = path;
  },

  replace: function (path) {
    window.location.replace(getWindowPath() + '#' + path);
  },

  pop: function () {
    window.history.back();
  },

  getCurrentPath: function () {
    return window.location.hash.substr(1);
  },

  toString: function () {
    return '<HashLocation>';
  }

};

module.exports = HashLocation;
