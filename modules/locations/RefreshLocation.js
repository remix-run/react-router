var HistoryLocation = require('./HistoryLocation');
var History = require('../History');

/**
 * A Location that uses full page refreshes. This is used as
 * the fallback for HistoryLocation in browsers that do not
 * support the HTML5 history API.
 */
var RefreshLocation = {

  push: function (path) {
    window.location = path;
  },

  replace: function (path) {
    window.location.replace(path);
  },

  pop: History.back,

  getCurrentPath: HistoryLocation.getCurrentPath,

  toString: function () {
    return '<RefreshLocation>';
  }

};

module.exports = RefreshLocation;
