var getWindowPath = require('./getWindowPath');

function getWindowChangeEvent() {
  return window.addEventListener ? 'hashchange' : 'onhashchange';
}

/**
 * Location handler which uses the `window.location.hash` to push and replace URLs
 */
var HashLocation = {

  type: 'hash',
  onChange: null,

  init: function(onChange) {
    var changeEvent = getWindowChangeEvent();

    if (window.location.hash === '') {
      this.replace('/');
    }

    if (window.addEventListener) {
      window.addEventListener(changeEvent, onChange, false);
    } else {
      window.attachEvent(changeEvent, onChange);
    }

    this.onChange = onChange;
    onChange();
  },

  destroy: function() {
    var changeEvent = getWindowChangeEvent();
    if (window.removeEventListener) {
      window.removeEventListener(changeEvent, this.onChange, false);
    } else {
      window.detachEvent(changeEvent, this.onChange);
    }
  },

  getCurrentPath: function() {
    return window.location.hash.substr(1);
  },

  push: function(path) {
    window.location.hash = path;
  },

  replace: function(path) {
    window.location.replace(getWindowPath() + '#' + path);
  },

  back: function() {
    window.history.back();
  }

};

module.exports = HashLocation;

