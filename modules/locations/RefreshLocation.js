var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var LocationActions = require('../actions/LocationActions');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var getWindowPath = require('../utils/getWindowPath');

/**
 * A Location that uses full page refreshes. This is used as
 * the fallback for HistoryLocation in browsers that do not
 * support the HTML5 history API.
 */
var RefreshLocation = {

  setup: function () {
    invariant(
      canUseDOM,
      'You cannot use RefreshLocation in an environment with no DOM'
    );

    LocationDispatcher.handleViewAction({
      type: LocationActions.SETUP,
      path: getWindowPath()
    });
  },

  push: function (path) {
    window.location = path;
  },

  replace: function (path) {
    window.location.replace(path);
  },

  pop: function () {
    window.history.back();
  },

  toString: function () {
    return '<RefreshLocation>';
  }

};

module.exports = RefreshLocation;
