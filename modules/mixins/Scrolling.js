var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var getWindowScrollPosition = require('../utils/getWindowScrollPosition');

/**
 * Provides the router with the ability to manage window scroll position
 * according to its scroll behavior.
 */
var Scrolling = {

  componentWillMount: function () {
    invariant(
      this.getScrollBehavior() == null || canUseDOM,
      'Cannot use scroll behavior without a DOM'
    );

    this._scrollHistory = {};
  },

  componentDidMount: function () {
    this._updateScroll();
  },

  componentWillUpdate: function () {
    this._scrollHistory[this.state.path] = getWindowScrollPosition();
  },

  componentDidUpdate: function () {
    this._updateScroll();
  },

  componentWillUnmount: function () {
    delete this._scrollHistory;
  },

  /**
   * Returns the last known scroll position for the given URL path.
   */
  getScrollPosition: function (path) {
    return this._scrollHistory[path] || null;
  },

  _updateScroll: function () {
    var scrollBehavior = this.getScrollBehavior();

    if (scrollBehavior)
      scrollBehavior.updateScrollPosition(
        this.getScrollPosition(this.state.path),
        this.state.action
      );
  }

};

module.exports = Scrolling;
