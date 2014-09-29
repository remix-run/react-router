var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var getWindowPath = require('../utils/getWindowPath');

function getHashPath() {
  return window.location.hash.substr(1);
}

var _actionType;

function ensureSlash() {
  var path = getHashPath();

  if (path.charAt(0) === '/')
    return true;

  HashLocation.replace('/' + path);

  return false;
}

function onHashChange() {
  if (ensureSlash()) {
    var path = getHashPath();

    LocationDispatcher.handleViewAction({
      // If we don't have an _actionType then all we know is the hash
      // changed. It was probably caused by the user clicking the Back
      // button, but may have also been the Forward button.
      type: _actionType || LocationActions.POP,
      path: getHashPath()
    });

    _actionType = null;
  }
}

var _isSetup = false;

/**
 * A Location that uses `window.location.hash`.
 */
var HashLocation = {

  setup: function () {
    if (_isSetup)
      return;

    invariant(
      canUseDOM,
      'You cannot use HashLocation in an environment with no DOM'
    );

    ensureSlash();

    LocationDispatcher.handleViewAction({
      type: LocationActions.SETUP,
      path: getHashPath()
    });

    if (window.addEventListener) {
      window.addEventListener('hashchange', onHashChange, false);
    } else {
      window.attachEvent('onhashchange', onHashChange);
    }

    _isSetup = true;
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('hashchange', onHashChange, false);
    } else {
      window.detachEvent('onhashchange', onHashChange);
    }

    _isSetup = false;
  },

  push: function (path) {
    _actionType = LocationActions.PUSH;
    window.location.hash = path;
  },

  replace: function (path) {
    _actionType = LocationActions.REPLACE;
    window.location.replace(getWindowPath() + '#' + path);
  },

  pop: function () {
    _actionType = LocationActions.POP;
    window.history.back();
  },

  toString: function () {
    return '<HashLocation>';
  }

};

module.exports = HashLocation;
