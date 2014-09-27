var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var getWindowPath = require('../utils/getWindowPath');

function getHashPath() {
  return window.location.hash.substr(1) || '/';
}

function ensureSlash() {
  var path = getHashPath();

  if (path.charAt(0) === '/')
    return true;

  HashLocation.replace('/' + path, _actionSender);

  return false;
}

var _actionType, _actionSender;

function onHashChange() {
  if (ensureSlash()) {
    LocationDispatcher.handleViewAction({
      type: _actionType,
      path: getHashPath(),
      sender: _actionSender || window
    });

    _actionSender = null;
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

    if (window.addEventListener) {
      window.addEventListener('hashchange', onHashChange, false);
    } else {
      window.attachEvent('onhashchange', onHashChange);
    }

    LocationDispatcher.handleViewAction({
      type: LocationActions.SETUP,
      path: getHashPath(),
      sender: window
    });

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

  push: function (path, sender) {
    _actionType = LocationActions.PUSH;
    _actionSender = sender;
    window.location.hash = path;
  },

  replace: function (path, sender) {
    _actionType = LocationActions.REPLACE;
    _actionSender = sender;
    window.location.replace(getWindowPath() + '#' + path);
  },

  pop: function (sender) {
    _actionType = LocationActions.POP;
    _actionSender = sender;
    window.history.back();
  },

  toString: function () {
    return '<HashLocation>';
  }

};

module.exports = HashLocation;
