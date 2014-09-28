var EventEmitter = require('events').EventEmitter;
var ActionTypes = require('../constants/ActionTypes');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');

var CHANGE_EVENT = 'change';
var _events = new EventEmitter;
var _currentPath = null;

function notifyChange() {
  _events.emit(CHANGE_EVENT);
}

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
  },

  /**
   * Returns the current URL path.
   */
  getCurrentPath: function () {
    return _currentPath;
  },

  dispatchToken: LocationDispatcher.register(function (payload) {
    var action = payload.action;

    switch (action.type) {
      case ActionTypes.SETUP:
      case ActionTypes.PUSH:
      case ActionTypes.REPLACE:
      case ActionTypes.POP:
        if (_currentPath !== action.path) {
          _currentPath = action.path;
          notifyChange();
        }
        break;
    }
  })

};

module.exports = PathStore;
