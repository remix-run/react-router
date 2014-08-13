var invariant = require('react/lib/invariant');

var _lastPath;
var _currentPath = '/';
var _onChange;

/**
 * Location handler that does not require a DOM.
 */
var MemoryLocation = {

  setup: function (onChange) {
    _onChange = onChange;
  },

  push: function (path) {
    _lastPath = _currentPath;
    _currentPath = path;
    _onChange();
  },

  replace: function (path) {
    _currentPath = path;
    _onChange();
  },

  pop: function () {
    invariant(
      _lastPath != null,
      'You cannot use MemoryLocation to go back more than once'
    );

    _currentPath = _lastPath;
    _lastPath = null;
    _onChange();
  },

  getCurrentPath: function () {
    return _currentPath;
  },

  toString: function () {
    return '<MemoryLocation>';
  }

};

module.exports = MemoryLocation;
