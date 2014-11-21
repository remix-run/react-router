var HistoryLocation = require('./HistoryLocation');
var Path = require('../utils/Path');

/**
 * A Location that uses full page refreshes. This is used as
 * the fallback for HistoryLocation in browsers that do not
 * support the HTML5 history API.
 */
var RefreshLocation = {

  push: function (path) {
    window.location = Path.encode(path);
  },

  replace: function (path) {
    window.location.replace(Path.encode(path));
  },

  pop: function () {
    window.history.back();
  },

  getCurrentPath: HistoryLocation.getCurrentPath,

  toString: function () {
    return '<RefreshLocation>';
  }

};

module.exports = RefreshLocation;
