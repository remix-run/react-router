var EventEmitter = require('events').EventEmitter;
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var PathStore; // TODO: Fix circular requires.

var CHANGE_EVENT = 'change';
var _events = new EventEmitter;

function notifyChange() {
  _events.emit(CHANGE_EVENT);
}

function getCurrentScrollPosition() {
  invariant(
    canUseDOM,
    'Cannot get current scroll position without a DOM'
  );

  return {
    x: window.scrollX,
    y: window.scrollY
  };
}

var _scrollPositions = {}, _currentScrollPosition;

/**
 * The ScrollStore keeps track of the current URL path.
 */
var ScrollStore = {

  addChangeListener: function (listener) {
    _events.addListener(CHANGE_EVENT, listener);
  },

  removeChangeListener: function (listener) {
    _events.removeListener(CHANGE_EVENT, listener);
  },

  removeAllChangeListeners: function () {
    _events.removeAllListeners(CHANGE_EVENT);
  },

  /**
   * Returns the last known scroll position for the current URL.
   */
  getCurrentScrollPosition: function () {
    return _currentScrollPosition;
  },

  dispatchToken: LocationDispatcher.register(function (payload) {
    if (PathStore == null)
      PathStore = require('./PathStore');

    var action = payload.action;

    switch (action.type) {
      case LocationActions.SETUP:
      case LocationActions.PUSH:
      case LocationActions.REPLACE:
      case LocationActions.POP:
        var currentPath = PathStore.getCurrentPath();

        if (currentPath)
          _scrollPositions[currentPath] = getCurrentScrollPosition();
        break;

      case LocationActions.FINISHED_TRANSITION:
        _currentScrollPosition = _scrollPositions[action.path];
        notifyChange();
        break;
    }
  })

};

module.exports = ScrollStore;
