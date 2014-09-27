var EventEmitter = require('events').EventEmitter;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');

var CHANGE_EVENT = 'change';
var _events = new EventEmitter;

function notifyChange(sender) {
  _events.emit(CHANGE_EVENT, sender);
}

var _currentPath;

/**
 * The PathStore keeps track of the current URL path.
 */
var PathStore = {

  addChangeListener: function (listener) {
    _events.addListener(CHANGE_EVENT, listener);
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
      case LocationActions.SETUP:
      case LocationActions.PUSH:
      case LocationActions.REPLACE:
      case LocationActions.POP:
        _currentPath = action.path;
        notifyChange(action.sender);
    }
  })

};

module.exports = PathStore;
