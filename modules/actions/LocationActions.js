var supportsHistory = require('../utils/supportsHistory');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var warning = require('react/lib/warning');
var isAbsoluteURL = require('../utils/isAbsoluteURL');
var makePath = require('../utils/makePath');

function loadURL(url) {
  window.location = url;
}

var _location = null;

/**
 * Actions that modify the URL.
 */
var LocationActions = {
  setup: function (location) {
    // When using HistoryLocation, automatically fallback
    // to RefreshLocation in browsers that do not support
    // the HTML5 history API.
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;

    if (_location == null) {
      _location = location;

      if (_location && typeof _location.setup === 'function')
        _location.setup();
    } else {
      warning(
        _location === location,
        'Cannot use location %s, already using %s', location, _location
      );
    }
  },

  teardown: function () {
    if (_location !== null) {
      _location.teardown();
      _location = null;
    }
  },

  getLocation: function () {
    return _location;
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
    }
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    _location.pop();
  },

  /**
   * Updates the window's scroll position to the last known position
   * for the current URL path.
   */
  updateScroll: function () {
    // TODO
  }

};

module.exports = LocationActions;
