var warning = require('react/lib/warning');

var _lastPath = null;
var _currentPath = null;

/**
 * A Location that does not require a DOM.
 */
var MemoryLocation = {

  push: function (path) {
    _lastPath = _currentPath;
    _currentPath = path;
  },

  replace: function (path) {
    _currentPath = path;
  },

  pop: function () {
    warning(
      _lastPath != null,
      'You cannot use MemoryLocation to go back more than once'
    );

    _currentPath = _lastPath;
    _lastPath = null;
  },

  getCurrentPath: function () {
    return _currentPath || '/';
  },

  toString: function () {
    return '<MemoryLocation>';
  }

};

module.exports = MemoryLocation;
