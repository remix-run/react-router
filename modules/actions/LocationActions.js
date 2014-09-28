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
var _isDispatching = false;
var _previousPath = null;

function dispatchAction(actionType, operation) {
  if (_isDispatching)
    throw new Error('Cannot handle ' + actionType + ' in the middle of another action.');

  _isDispatching = true;

  var scrollPosition = {
    x: window.scrollX,
    y: window.scrollY
  };

  if (typeof operation === 'function')
    operation(_location);

  var path = _location.getCurrentPath();
  LocationDispatcher.handleViewAction({
    type: actionType,
    path: path,
    scrollPosition: scrollPosition
  });

  _isDispatching = false;
  _previousPath = path;
}

function handleChange() {
  var path = _location.getCurrentPath();

  // Ignore changes inside or caused by dispatchAction
  if (!_isDispatching && path !== _previousPath) {
    dispatchAction(ActionTypes.POP);
  }
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

    if (_location !== null) {
      warning(
        _location === location,
        'Cannot use location %s, already using %s', location, _location
      );
      return;
    }

    _location = location;

    if (_location !== null) {
      dispatchAction(ActionTypes.SETUP, function (location) {
        if (typeof location.setup === 'function')
          location.setup(handleChange);
      });
    }
  },

  teardown: function () {
    if (_location !== null) {
      if (typeof _location.teardown === 'function')
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
      dispatchAction(ActionTypes.PUSH, function (location) {
        var path = makePath(to, params, query);
        location.push(path);
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
      dispatchAction(ActionTypes.REPLACE, function (location) {
        var path = makePath(to, params, query);
        location.replace(path);
      });
    }
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    dispatchAction(ActionTypes.POP, function (location) {
      location.pop();
    });
  }

};

module.exports = LocationActions;
