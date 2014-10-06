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

  getInitialState: function () {
    var behavior = this.props.scrollBehavior;

    if (typeof behavior === 'string')
      behavior = NAMED_SCROLL_BEHAVIORS[behavior];

    return {
      scrollBehavior: behavior
    };
  },

  componentWillMount: function () {
    var behavior = this.getScrollBehavior();

    invariant(
      behavior == null || canUseDOM,
      'Cannot use scroll behavior without a DOM'
    );

    if (behavior != null)
      this._scrollPositions = {};
  },

  recordScroll: function (path) {
    if (this._scrollPositions)
      this._scrollPositions[path] = getWindowScrollPosition();
  },

  updateScroll: function (path, actionType) {
    var behavior = this.getScrollBehavior();
    var position = this._scrollPositions[path];

    if (behavior && position)
      behavior.updateScrollPosition(position, actionType);
  },

  /**
   * Returns the scroll behavior object this component uses.
   */
  getScrollBehavior: function () {
    return this.state.scrollBehavior;
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
