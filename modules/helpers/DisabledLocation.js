var getWindowPath = require('./getWindowPath');

/**
 * Location handler that doesn't actually do any location handling.  Instead, requests
 * are sent to the server as normal.
 */
var DisabledLocation = {

  type: 'disabled',

  init: function() { },

  destroy: function() { },

  getCurrentPath: function() {
    return getWindowPath();
  },

  push: function(path) {
    window.location = path;
  },

  replace: function(path) {
    window.location.replace(path);
  },

  back: function() {
    window.history.back();
  }

};

module.exports = DisabledLocation;

