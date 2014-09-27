var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var invariant = require('react/lib/invariant');

/**
 * A scroll behavior that attempts to imitate the default behavior
 * of modern browsers.
 */
var ImitateBrowserBehavior = {

  updateScrollPosition: function (position, sender) {
    if (sender === window) {
      window.scrollTo(position.x, position.y);
    } else {
      // Clicking on links always scrolls the window to the top.
      window.scrollTo(0, 0);
    }
  }

};

/**
 * A scroll behavior that always scrolls to the top of the page
 * after a transition.
 */
var ScrollToTopBehavior = {

  updateScrollPosition: function () {
    window.scrollTo(0, 0);
  }

};

/**
 * A hash of { name: scrollBehavior } pairs.
 */
var NAMED_SCROLL_BEHAVIORS = {
  none: null,
  imitateBrowser: ImitateBrowserBehavior,
  scrollToTop: ScrollToTopBehavior
};

/**
 * A mixin for components that need to know the current scroll position.
 */
var ScrollState = {

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

  /**
   * Gets the scroll behavior object this component uses to observe
   * the current scroll position.
   */
  getScrollBehavior: function () {
    var behavior = this.props.scrollBehavior;

    if (typeof behavior === 'string')
      behavior = NAMED_SCROLL_STRATEGIES[behavior];

    return behavior;
  },

  componentWillMount: function () {
    var behavior = this.getScrollBehavior();

    invariant(
      behavior == null || canUseDOM,
      'Cannot use scroll behavior without a DOM'
    );
  },

  /**
   * Returns the current scroll position as { x, y }.
   */
  getCurrentScrollPosition: function () {
    invariant(
      canUseDOM,
      'Cannot get current scroll position without a DOM'
    );

    return {
      x: window.scrollX,
      y: window.scrollY
    };
  }

};

module.exports = ScrollState;
