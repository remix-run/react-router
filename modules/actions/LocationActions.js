var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var makePath = require('../helpers/makePath');

/**
 * Actions that modify the URL.
 */
var LocationActions = {

  PUSH: 'push',
  REPLACE: 'replace',
  POP: 'pop',
  UPDATE_SCROLL: 'update-scroll',

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query) {
    LocationDispatcher.handleViewAction({
      type: LocationActions.PUSH,
      path: makePath(to, params, query)
    });
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query) {
    LocationDispatcher.handleViewAction({
      type: LocationActions.REPLACE,
      path: makePath(to, params, query)
    });
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    LocationDispatcher.handleViewAction({
      type: LocationActions.POP
    });
  },

  /**
   * Updates the window's scroll position to the last known position
   * for the current URL path.
   */
  updateScroll: function () {
    LocationDispatcher.handleViewAction({
      type: LocationActions.UPDATE_SCROLL
    });
  }

};

module.exports = LocationActions;
