var React = require('react');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var ImitateBrowserBehavior = require('../behaviors/ImitateBrowserBehavior');
var ScrollToTopBehavior = require('../behaviors/ScrollToTopBehavior');

function getWindowScrollPosition() {
  invariant(
    canUseDOM,
    'Cannot get current scroll position without a DOM'
  );

  return {
    x: window.scrollX,
    y: window.scrollY
  };
}

/**
 * A hash of { name: scrollBehavior } pairs.
 */
var NAMED_SCROLL_BEHAVIORS = {
  none: null,
  browser: ImitateBrowserBehavior,
  imitateBrowser: ImitateBrowserBehavior,
  scrollToTop: ScrollToTopBehavior
};

/**
 * A mixin for components that manage scroll position.
 */
var ScrollContext = {

  propTypes: {
    scrollBehavior: function (props, propName, componentName) {
      var behavior = props[propName];

      if (typeof behavior === 'string' && !(behavior in NAMED_SCROLL_BEHAVIORS))
        return new Error('Unknown scroll behavior "' + behavior + '", see ' + componentName);
    }
  },

  getDefaultProps: function () {
    return {
      scrollBehavior: canUseDOM ? ImitateBrowserBehavior : null
    };
  },

  componentWillMount: function () {
    invariant(
      this.getScrollBehavior() == null || canUseDOM,
      'Cannot use scroll behavior without a DOM'
    );
  },

  recordScroll: function (path) {
    var positions = this.getScrollPositions();
    positions[path] = getWindowScrollPosition();
  },

  updateScroll: function (path, actionType) {
    var behavior = this.getScrollBehavior();
    var position = this.getScrollPosition(path) || null;

    if (behavior)
      behavior.updateScrollPosition(position, actionType);
  },

  /**
   * Returns the scroll behavior object this component uses.
   */
  getScrollBehavior: function () {
    if (this._scrollBehavior == null) {
      var behavior = this.props.scrollBehavior;

      if (typeof behavior === 'string')
        behavior = NAMED_SCROLL_BEHAVIORS[behavior];

      this._scrollBehavior = behavior;
    }

    return this._scrollBehavior;
  },

  /**
   * Returns a hash of URL paths to their last known scroll positions.
   */
  getScrollPositions: function () {
    if (this._scrollPositions == null)
      this._scrollPositions = {};

    return this._scrollPositions;
  },

  /**
   * Returns the last known scroll position for the given URL path.
   */
  getScrollPosition: function (path) {
    var positions = this.getScrollPositions();
    return positions[path];
  },

  childContextTypes: {
    scrollBehavior: React.PropTypes.object // Not required on the server.
  },

  getChildContext: function () {
    return {
      scrollBehavior: this.getScrollBehavior()
    };
  }

};

module.exports = ScrollContext;
