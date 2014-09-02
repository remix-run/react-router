var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var getWindowPath = require('../utils/getWindowPath');

function getHashPath() {
  return window.location.hash.substr(1);
}

function ensureSlash() {
  var path = getHashPath();

  if (path.charAt(0) === '/')
    return true;

  HashLocation.replace('/' + path);

  return false;
}

var _onChange;

function handleHashChange() {
  if (ensureSlash())
    _onChange();
}

/**
 * A Location that uses `window.location.hash`.
 */
var HashLocation = {

  setup: function (onChange) {
    invariant(
      canUseDOM,
      'You cannot use HashLocation in an environment with no DOM'
    );

    _onChange = onChange;

    ensureSlash();

    if (window.addEventListener) {
      window.addEventListener('hashchange', handleHashChange, false);
    } else {
      window.attachEvent('onhashchange', handleHashChange);
    }
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('hashchange', handleHashChange, false);
    } else {
      window.detachEvent('onhashchange', handleHashChange);
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

  getCurrentPath: getHashPath,

  toString: function () {
    return '<HashLocation>';
  }

};

module.exports = HashLocation;
