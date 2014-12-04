var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;

var History = {

  /**
   * Sends the browser back one entry in the history, if one is available.
   */
  back: function () {
    invariant(
      canUseDOM,
      'Cannot use History.back without a DOM'
    );

    // Do this first so that History.length will
    // be accurate in location change listeners.
    History.length -= 1;

    window.history.back();
  },

  /**
   * The current number of entries in the history.
   */
  length: 1

};

module.exports = History;
