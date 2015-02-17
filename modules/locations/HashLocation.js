var LocationActions = require('../actions/LocationActions');
var History = require('../History');

/**
 * Returns the current URL path from the `hash` portion of the URL, including
 * query string.
 */
function getHashPath() {
  return decodeURI(
    // We can't use window.location.hash here because it's not
    // consistent across browsers - Firefox will pre-decode it!
    window.location.href.split('#')[1] || ''
  );
}

var _actionType;

function ensureSlash() {
  var path = getHashPath();

  if (path.charAt(0) === '/')
    return true;

  HashLocation.replace('/' + path);

  return false;
}

var _changeListeners = [];

function notifyChange(type) {
  if (type === LocationActions.PUSH)
    History.length += 1;

  var change = {
    path: getHashPath(),
    type: type
  };

  _changeListeners.forEach(function (listener) {
    listener(change);
  });
}

var _isListening = false;

function onHashChange() {
  if (ensureSlash()) {
    // If we don't have an _actionType then all we know is the hash
    // changed. It was probably caused by the user clicking the Back
    // button, but may have also been the Forward button or manual
    // manipulation. So just guess 'pop'.
    notifyChange(_actionType || LocationActions.POP);
    _actionType = null;
  }
}

/**
 * A Location that uses `window.location.hash`.
 */
var HashLocation = {

  addChangeListener: function (listener) {
    _changeListeners.push(listener);

    // Do this BEFORE listening for hashchange.
    ensureSlash();

    if (!_isListening) {
      if (window.addEventListener) {
        window.addEventListener('hashchange', onHashChange, false);
      } else {
        window.attachEvent('onhashchange', onHashChange);
      }

      _isListening = true;
    }
  },

  removeChangeListener: function(listener) {
    _changeListeners = _changeListeners.filter(function (l) {
      return l !== listener;
    });

    if (_changeListeners.length === 0) {
      if (window.removeEventListener) {
        window.removeEventListener('hashchange', onHashChange, false);
      } else {
        window.removeEvent('onhashchange', onHashChange);
      }

      _isListening = false;
    }
  },

  push: function (path) {
    _actionType = LocationActions.PUSH;
    window.location.hash = path;
  },

  replace: function (path) {
    _actionType = LocationActions.REPLACE;
    window.location.replace(
      window.location.pathname + window.location.search + '#' + path
    );
  },

  pop: function () {
    _actionType = LocationActions.POP;
    History.back();
  },

  getCurrentPath: getHashPath,

  toString: function () {
    return '<HashLocation>';
  }

};

module.exports = HashLocation;
