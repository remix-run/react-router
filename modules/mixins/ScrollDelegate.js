var ScrollState = require('./ScrollState');

/**
 * A mixin for components that manage the window's scroll position.
 */
var ScrollDelegate = {

  mixins: [ ScrollState ],

  componentWillMount: function () {
    if (this.getScrollBehavior())
      this._scrollPositions = {};
  },

  /**
   * Records the current scroll position for the given path.
   */
  recordScroll: function (path) {
    if (this._scrollPositions)
      this._scrollPositions[path] = this.getCurrentScrollPosition();
  },

  /**
   * Updates the current scroll position according to the last
   * one that was recorded for the given path.
   */
  updateScroll: function (path, actionType) {
    if (this._scrollPositions) {
      var behavior = this.getScrollBehavior();
      var position = this._scrollPositions[path];

      if (behavior && position)
        behavior.updateScrollPosition(position, actionType);
    }
  }

};

module.exports = ScrollDelegate;
