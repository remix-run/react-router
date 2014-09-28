var supportsHistory = require('../utils/supportsHistory');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var ActionTypes = require('../constants/ActionTypes');
var warning = require('react/lib/warning');
var isAbsoluteURL = require('../utils/isAbsoluteURL');
var makePath = require('../utils/makePath');

function loadURL(url) {
  window.location = url;
}

var _location = null;

function handlePop() {
  LocationDispatcher.handleBrowserAction({
    type: ActionTypes.POP,
    path: _location.getCurrentPath()
  });
}

/**
 * Actions that modify the URL.
 */
var LocationActions = {

  getLocation: function () {
    return _location;
  },

  setup: function (location) {
    // When using HistoryLocation, automatically fallback
    // to RefreshLocation in browsers that do not support
    // the HTML5 history API.
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;

    if (_location != null) {
      warning(
        _location === location,
        'Cannot use location %s, already using %s', location, _location
      );
      return;
    }

    _location = location;

    if (!_location)
      return;

    _location.setup(handlePop);
    LocationDispatcher.handleBrowserAction({
      type: ActionTypes.SETUP,
      path: _location.getCurrentPath()
    });
  },

  teardown: function () {
    if (_location !== null) {
      _location.teardown();
      _location = null;
    }
  },

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query) {
    if (isAbsoluteURL(to)) {
      loadURL(to);
    } else {
      var path = makePath(to, params, query);
      _location.push(path);

      LocationDispatcher.handleViewAction({
        type: ActionTypes.PUSH,
        path: _location.getCurrentPath()
      });
    }
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query) {
    if (isAbsoluteURL(to)) {
      loadURL(to);
    } else {
      var path = makePath(to, params, query);
      _location.replace(path);

      LocationDispatcher.handleViewAction({
        type: ActionTypes.REPLACE,
        path: _location.getCurrentPath()
      });
    }
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    _location.pop();

    LocationDispatcher.handleViewAction({
      type: ActionTypes.POP,
      path: _location.getCurrentPath()
    });
  }

};

module.exports = LocationActions;
