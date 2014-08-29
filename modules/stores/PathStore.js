var warning = require('react/lib/warning');
var EventEmitter = require('events').EventEmitter;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var supportsHistory = require('../helpers/supportsHistory');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');

var CHANGE_EVENT = 'change';
var _events = new EventEmitter;

function notifyChange() {
  _events.emit(CHANGE_EVENT);
}

var _scrollPositions = {};

function recordScrollPosition(path) {
  _scrollPositions[path] = {
    x: window.scrollX,
    y: window.scrollY
  };
}

function updateScrollPosition(path) {
  var p = PathStore.getScrollPosition(path);
  window.scrollTo(p.x, p.y);
}

var _location;

/**
 * The PathStore keeps track of the current URL path and manages
 * the location strategy that is used to update the URL.
 */
var PathStore = {

  addChangeListener: function (listener) {
    _events.on(CHANGE_EVENT, listener);
  },

  removeChangeListener: function (listener) {
    _events.removeListener(CHANGE_EVENT, listener);

    // Automatically teardown when the last listener is removed.
    if (EventEmitter.listenerCount(_events, CHANGE_EVENT) === 0)
      PathStore.teardown();
  },

  setup: function (location) {
    // When using HistoryLocation, automatically fallback
    // to RefreshLocation in browsers that do not support
    // the HTML5 history API.
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;

    if (_location == null) {
      _location = location;

      if (_location && typeof _location.setup === 'function')
        _location.setup(notifyChange);
    } else {
      warning(
        _location === location,
        'Cannot use location %s, already using %s', location, _location
      );
    }
  },

  teardown: function () {
    if (_location && typeof _location.teardown === 'function')
      _location.teardown();

    _location = null;
  },

  /**
   * Returns the location object currently in use.
   */
  getLocation: function () {
    return _location;
  },

  /**
   * Returns the current URL path.
   */
  getCurrentPath: function () {
    return _location.getCurrentPath();
  },

  /**
   * Returns the last known scroll position for the given path.
   */
  getScrollPosition: function (path) {
    return _scrollPositions[path] || { x: 0, y: 0 };
  },

  dispatchToken: LocationDispatcher.register(function (payload) {
    var action = payload.action;
    var currentPath = _location.getCurrentPath();

    switch (action.type) {
      case LocationActions.PUSH:
        if (currentPath !== action.path) {
          recordScrollPosition(currentPath);
          _location.push(action.path);
        }
        break;

      case LocationActions.REPLACE:
        if (currentPath !== action.path) {
          recordScrollPosition(currentPath);
          _location.replace(action.path);
        }
        break;

      case LocationActions.POP:
        recordScrollPosition(currentPath);
        _location.pop();
        break;

      case LocationActions.UPDATE_SCROLL:
        updateScrollPosition(currentPath);
        break;
    }
  })

};

module.exports = PathStore;
