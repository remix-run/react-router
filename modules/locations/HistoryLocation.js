var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var getWindowPath = require('../utils/getWindowPath');

function onPopState() {
  LocationDispatcher.handleViewAction({
    type: LocationActions.POP,
    path: getWindowPath()
  });
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

    LocationDispatcher.handleViewAction({
      type: LocationActions.SETUP,
      path: getWindowPath()
    });

    if (window.addEventListener) {
      window.addEventListener('popstate', onPopState, false);
    } else {
      window.attachEvent('popstate', onPopState);
    }

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

  push: function (path) {
    window.history.pushState({ path: path }, '', path);

    LocationDispatcher.handleViewAction({
      type: LocationActions.PUSH,
      path: getWindowPath()
    });
  },

  replace: function (path) {
    window.history.replaceState({ path: path }, '', path);

    LocationDispatcher.handleViewAction({
      type: LocationActions.REPLACE,
      path: getWindowPath()
    });
  },

  pop: function () {
    window.history.back();
  },

  toString: function () {
    return '<HistoryLocation>';
  }

};

module.exports = HistoryLocation;
