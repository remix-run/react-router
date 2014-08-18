var invariant = require('react/lib/invariant');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var getWindowPath = require('../helpers/getWindowPath');

/**
 * A Location that uses full page refreshes. This is used as
 * the fallback for HistoryLocation in browsers that do not
 * support the HTML5 history API.
 */
var RefreshLocation = {

  setup: function () {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'You cannot use RefreshLocation in an environment with no DOM'
    );
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

  getCurrentPath: getWindowPath,

  toString: function () {
    return '<RefreshLocation>';
  }

};

module.exports = RefreshLocation;
