var LocationActions = require('../actions/LocationActions');
var getWindowPath = require('../utils/getWindowPath');

function getHashPath() {
  return window.location.hash.substr(1);
}

var _actionType;

function ensureSlash() {
  var path = getHashPath();

  if (path.charAt(0) === '/')
    return true;

  HashLocation.replace('/' + path);

  return false;
}

var _onChange;

function onHashChange() {
  if (ensureSlash()) {
    var path = getHashPath();

    _onChange({
      // If we don't have an _actionType then all we know is the hash
      // changed. It was probably caused by the user clicking the Back
      // button, but may have also been the Forward button or manual
      // manipulation. So just guess 'pop'.
      type: _actionType || LocationActions.POP,
      path: getHashPath()
    });

    _actionType = null;
  }
}

/**
 * A Location that uses `window.location.hash`.
 */
var HashLocation = {

  setup: function (onChange) {
    _onChange = onChange;

    // Do this BEFORE listening for hashchange.
    ensureSlash();

    if (window.addEventListener) {
      window.addEventListener('hashchange', onHashChange, false);
    } else {
      window.attachEvent('onhashchange', onHashChange);
    }
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('hashchange', onHashChange, false);
    } else {
      window.detachEvent('onhashchange', onHashChange);
    }
  },

  push: function (path) {
    _actionType = LocationActions.PUSH;
    window.location.hash = path;
  },

  replace: function (path) {
    _actionType = LocationActions.REPLACE;
    window.location.replace(getWindowPath() + '#' + path);
  },

  pop: function () {
    _actionType = LocationActions.POP;
    window.history.back();
  },

  getCurrentPath: getHashPath,

  toString: function () {
    return '<HashLocation>';
  }

};

module.exports = HashLocation;
