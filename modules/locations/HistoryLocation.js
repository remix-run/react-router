var LocationActions = require('../actions/LocationActions');
var History = require('../History');

/**
 * Returns the current URL path from `window.location`, including query string.
 */
function getWindowPath() {
  return decodeURI(
    window.location.pathname + window.location.search
  );
}

var _changeListeners = [];

function notifyChange(type, state) {
  var change = {
    path: getWindowPath(),
    type: type,
    state: state || window.history.state
  };

  _changeListeners.forEach(function (listener) {
    listener(change);
  });
}

var _isListening = false;

function onPopState (event) {
  notifyChange(LocationActions.POP, event.state);
}

/**
 * A Location that uses HTML5 history.
 */
var HistoryLocation = {

  supportsState: true,

  addChangeListener: function (listener) {
    _changeListeners.push(listener);

    if (!_isListening) {
      if (window.addEventListener) {
        window.addEventListener('popstate', onPopState, false);
      } else {
        window.attachEvent('popstate', onPopState);
      }

      _isListening = true;
    }
  },

  removeChangeListener: function(listener) {
    _changeListeners = _changeListeners.filter(function (l) {
      return l !== listener;
    });

    if (_changeListeners.length === 0) {
      if (window.addEventListener) {
        window.removeEventListener('popstate', onPopState);
      } else {
        window.removeEvent('popstate', onPopState);
      }

      _isListening = false;
    }
  },

  push: function (path, state) {
    window.history.pushState(state, '', encodeURI(path));
    History.length += 1;
    notifyChange(LocationActions.PUSH);
  },

  replace: function (path, state) {
    window.history.replaceState(state, '', encodeURI(path));
    notifyChange(LocationActions.REPLACE);
  },

  replaceState: function (state, silent) {
    window.history.replaceState(state, '', encodeURI(getWindowPath()));
    if (!silent) {
      notifyChange(LocationActions.REPLACE);
    }
  },

  pop: History.back,

  getCurrentPath: getWindowPath,

  getCurrentState: function () {
    return window.history.state;
  },

  toString: function () {
    return '<HistoryLocation>';
  }

};

module.exports = HistoryLocation;
