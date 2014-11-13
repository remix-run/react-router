var LocationActions = require('../actions/LocationActions');
var getWindowPath = require('../utils/getWindowPath');

var _onChange, _isListening;

function onPopState() {
  _onChange({
    type: LocationActions.POP,
    path: getWindowPath()
  });
}

/**
 * A Location that uses HTML5 history.
 */
var HistoryLocation = {

  setup: function (onChange) {
    _onChange = onChange;

    if (_isListening)
      return;

    if (window.addEventListener) {
      window.addEventListener('popstate', onPopState, false);
    } else {
      window.attachEvent('popstate', onPopState);
    }

    _isListening = true;
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', onPopState, false);
    } else {
      window.detachEvent('popstate', onPopState);
    }

    _isListening = false;
  },

  push: function (path) {
    window.history.pushState({ path: path }, '', path);

    _onChange({
      type: LocationActions.PUSH,
      path: getWindowPath()
    });
  },

  replace: function (path) {
    window.history.replaceState({ path: path }, '', path);

    _onChange({
      type: LocationActions.REPLACE,
      path: getWindowPath()
    });
  },

  pop: function () {
    window.history.back();
  },

  getCurrentPath: getWindowPath,

  toString: function () {
    return '<HistoryLocation>';
  }

};

module.exports = HistoryLocation;
