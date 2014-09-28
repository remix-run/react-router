var ActionTypes = require('../constants/ActionTypes');

var _currentPath = null;
var _scrollPositions = {};

function getScrollPosition(path) {
  return _scrollPositions[path] || { x: 0, y: 0 };
}

function resetScrollPosition(path) {
  _scrollPositions[path] = { x: 0, y: 0 };
  return getScrollPosition(path);
}

var ImitateBrowserStrategy = {

  getScrollPosition: function (action) {
    if (action.path === _currentPath) {
      return;
    }

    // Record scroll position before the action
    if (_currentPath) {
      _scrollPositions[_currentPath] = action.scrollPosition;
    }
    _currentPath = action.path;

    switch (action.type) {
      case ActionTypes.SETUP:
        // For the initial load, let browser scroll where it wants to
        return null;

      case ActionTypes.PUSH:
      case ActionTypes.REPLACE:
        // Reset stored position on manually initiated transitions
        return resetScrollPosition(action.path);

      case ActionTypes.POP:
        // Try to restore saved position
        return getScrollPosition(action.path);
    }
  },

  teardown: function () {
    _currentPath = null;
    _scrollPositions = {};
  },

  toString: function () {
    return '<ImitateBrowserStrategy>';
  }

};

module.exports = ImitateBrowserStrategy;