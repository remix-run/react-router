var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var ActionTypes = require('../constants/ActionTypes');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var getWindowPath = require('../utils/getWindowPath');

/**
 * A Location that uses HTML5 history.
 */
var HistoryLocation = {

  setup: function () {
    invariant(
      canUseDOM,
      'You cannot use HistoryLocation in an environment with no DOM'
    );

    if (window.addEventListener) {
      window.addEventListener('popstate', this._handlePopState, false);
    } else {
      window.attachEvent('popstate', this._handlePopState);
    }

    LocationDispatcher.handleBrowserAction({
      type: ActionTypes.SETUP,
      path: getWindowPath()
    });
  },

  teardown: function () {
    if (window.removeEventListener) {
      window.removeEventListener('popstate', this._handlePopState, false);
    } else {
      window.detachEvent('popstate', this._handlePopState);
    }
  },

  push: function (path) {
    window.history.pushState({ path: path }, '', path);

    LocationDispatcher.handleViewAction({
      type: ActionTypes.PUSH,
      path: path
    });
  },

  replace: function (path) {
    window.history.replaceState({ path: path }, '', path);

    LocationDispatcher.handleViewAction({
      type: ActionTypes.REPLACE,
      path: path
    });
  },

  pop: function () {
    window.history.back();

    LocationDispatcher.handleViewAction({
      type: ActionTypes.POP,
      path: getWindowPath()
    });
  },

  _handlePopState: function () {
    LocationDispatcher.handleBrowserAction({
      type: ActionTypes.POP,
      path: getWindowPath()
    });
  },

  toString: function () {
    return '<HistoryLocation>';
  }

};

module.exports = HistoryLocation;
