var warning = require('react/lib/warning');
var EventEmitter = require('events').EventEmitter;
var supportsHistory = require('../helpers/supportsHistory');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');

var CHANGE_EVENT = 'change';
var _events = new EventEmitter;

function notifyChange() {
  _events.emit(CHANGE_EVENT);
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

  getLocation: function () {
    return _location;
  },

  push: function (path) {
    if (_location.getCurrentPath() !== path)
      _location.push(path);
  },

  replace: function (path) {
    if (_location.getCurrentPath() !== path)
      _location.replace(path);
  },

  pop: function () {
    _location.pop();
  },

  getCurrentPath: function () {
    return _location.getCurrentPath();
  }

};

module.exports = PathStore;
