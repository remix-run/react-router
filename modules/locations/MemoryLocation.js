var warning = require('react/lib/warning');

var _lastPath = null;
var _currentPath = null;
var _onChange;

/**
 * A Location that does not require a DOM.
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
    warning(
      _lastPath != null,
      'You cannot use MemoryLocation to go back more than once'
    );

    _currentPath = _lastPath;
    _lastPath = null;
    _onChange();
  },

  getCurrentPath: function () {
    return _currentPath || '/';
  },

  toString: function () {
    return '<MemoryLocation>';
  }

};

module.exports = MemoryLocation;
