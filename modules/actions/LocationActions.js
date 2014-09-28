var ActionTypes = require('../constants/ActionTypes');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var isAbsoluteURL = require('../utils/isAbsoluteURL');
var makePath = require('../utils/makePath');

function loadURL(url) {
  window.location = url;
}

/**
 * Actions that modify the URL.
 */
var LocationActions = {

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query) {
    if (isAbsoluteURL(to)) {
      loadURL(to);
    } else {
      LocationDispatcher.handleViewAction({
        type: ActionTypes.PUSH,
        path: makePath(to, params, query)
      });
    }
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query) {
    if (isAbsoluteURL(to)) {
      loadURL(to);
    } else {
      LocationDispatcher.handleViewAction({
        type: ActionTypes.REPLACE,
        path: makePath(to, params, query)
      });
    }
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    LocationDispatcher.handleViewAction({
      type: ActionTypes.POP
    });
  },

  /**
   * Updates the window's scroll position to the last known position
   * for the current URL path.
   */
  updateScroll: function () {
    LocationDispatcher.handleViewAction({
      type: ActionTypes.UPDATE_SCROLL
    });
  }

};

module.exports = LocationActions;
