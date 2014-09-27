var warning = require('react/lib/warning');
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');

var _lastPath = null;
var _currentPath = null;

function getCurrentPath() {
  return _currentPath || '/';
}

/**
 * A Location that does not require a DOM.
 */
var MemoryLocation = {

  setup: function () {
    LocationDispatcher.handleViewAction({
      type: LocationActions.SETUP,
      path: getCurrentPath()
    });
  },

  push: function (path, sender) {
    _lastPath = _currentPath;
    _currentPath = path;

    LocationDispatcher.handleViewAction({
      type: LocationActions.PUSH,
      path: getCurrentPath(),
      sender: sender
    });
  },

  replace: function (path, sender) {
    _currentPath = path;

    LocationDispatcher.handleViewAction({
      type: LocationActions.REPLACE,
      path: getCurrentPath(),
      sender: sender
    });
  },

  pop: function (sender) {
    warning(
      _lastPath != null,
      'You cannot use MemoryLocation to go back more than once'
    );

    _currentPath = _lastPath;
    _lastPath = null;

    LocationDispatcher.handleViewAction({
      type: LocationActions.POP,
      path: getCurrentPath(),
      sender: sender
    });
  },

  toString: function () {
    return '<MemoryLocation>';
  }

};

module.exports = MemoryLocation;
