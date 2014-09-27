var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var getWindowPath = require('../utils/getWindowPath');

var _actionSender;

function onPopState() {
  LocationDispatcher.handleViewAction({
    type: LocationActions.POP,
    path: getWindowPath(),
    sender: _actionSender || window
  });

  _actionSender = null;
}

var _isSetup = false;

/**
 * A Location that uses HTML5 history.
 */
var HistoryLocation = {

  setup: function () {
    if (_isSetup)
      return;

    invariant(
      canUseDOM,
      'You cannot use HistoryLocation in an environment with no DOM'
    );

    if (window.addEventListener) {
      window.addEventListener('popstate', onPopState, false);
    } else {
      window.attachEvent('popstate', onPopState);
    }

    LocationDispatcher.handleViewAction({
      type: LocationActions.SETUP,
      path: getWindowPath(),
      sender: window
    });

    _isSetup = true;
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', onPopState, false);
    } else {
      window.detachEvent('popstate', onPopState);
    }

    _isSetup = false;
  },

  push: function (path, sender) {
    window.history.pushState({ path: path }, '', path);

    LocationDispatcher.handleViewAction({
      type: LocationActions.PUSH,
      path: getWindowPath(),
      sender: sender
    });
  },

  replace: function (path, sender) {
    window.history.replaceState({ path: path }, '', path);

    LocationDispatcher.handleViewAction({
      type: LocationActions.REPLACE,
      path: getWindowPath(),
      sender: sender
    });
  },

  pop: function (sender) {
    _actionSender = sender;
    window.history.back();
  },

  toString: function () {
    return '<HistoryLocation>';
  }

};

module.exports = HistoryLocation;
