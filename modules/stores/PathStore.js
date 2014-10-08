var invariant = require('react/lib/invariant');
var EventEmitter = require('events').EventEmitter;
var LocationActions = require('../actions/LocationActions');

var CHANGE_EVENT = 'change';
var _events = new EventEmitter;

function notifyChange() {
  _events.emit(CHANGE_EVENT);
}

var _currentLocation, _currentPath, _currentActionType;

function handleLocationChangeAction(action) {
  if (_currentPath !== action.path) {
    _currentPath = action.path;
    _currentActionType = action.type;
    notifyChange();
  }
}

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

  removeAllChangeListeners: function () {
    _events.removeAllListeners(CHANGE_EVENT);
  },

  /**
   * Setup the PathStore to use the given location.
   */
  useLocation: function (location) {
    invariant(
      _currentLocation == null || _currentLocation === location,
      'You cannot use %s and %s on the same page',
      _currentLocation, location
    );

    if (_currentLocation !== location) {
      if (location.setup)
        location.setup(handleLocationChangeAction);

      _currentPath = location.getCurrentPath();
    }

    _currentLocation = location;
  },

  /**
   * Returns the current URL path.
   */
  getCurrentPath: function () {
    return _currentPath;
  },

  /**
   * Returns the type of the action that changed the URL.
   */
  getCurrentActionType: function () {
    return _currentActionType;
  }

};

module.exports = PathStore;
