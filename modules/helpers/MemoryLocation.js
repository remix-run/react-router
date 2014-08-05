var invariant = require('react/lib/invariant');

var _lastPath;
var _currentPath = '/';

/**
 * Fake location handler that can be used outside the scope of the browser.  It
 * tracks the current and previous path, as given to #push() and #replace().
 */
var MemoryLocation = {

  type: 'memory',
  onChange: null,

  init: function(onChange) {
    this.onChange = onChange;
  },

  destroy: function() {
    this.onChange = null;
    _lastPath = null;
    _currentPath = '/';
  },

  getCurrentPath: function() {
    return _currentPath;
  },

  push: function(path) {
    _lastPath = _currentPath;
    _currentPath = path;
    this.onChange();
  },

  replace: function(path) {
    _currentPath = path;
    this.onChange();
  },

  back: function() {
    invariant(
      _lastPath,
      'You cannot make the URL store go back more than once when it does not use the DOM'
    );

    _currentPath = _lastPath;
    _lastPath = null;
    this.onChange();
  }
};

module.exports = MemoryLocation;

