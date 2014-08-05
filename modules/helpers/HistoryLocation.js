var getWindowPath = require('./getWindowPath');

/**
 * Location handler which uses the HTML5 History API to push and replace URLs
 */
var HistoryLocation = {

  type: 'history',
  onChange: null,

  init: function(onChange) {
    if (window.addEventListener) {
      window.addEventListener('popstate', onChange, false);
    } else {
      window.attachEvent('popstate', onChange);
    }
    this.onChange = onChange;
    onChange();
  },

  destroy: function() {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', this.onChange, false);
    } else {
      window.detachEvent('popstate', this.onChange);
    }
  },

  getCurrentPath: function() {
    return getWindowPath();
  },

  push: function(path) {
    window.history.pushState({ path: path }, '', path);
    this.onChange();
  },

  replace: function(path) {
    window.history.replaceState({ path: path }, '', path);
    this.onChange();
  },

  back: function() {
    window.history.back();
  }

};

module.exports = HistoryLocation;

