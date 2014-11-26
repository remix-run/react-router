var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var getWindowScrollPosition = require('../utils/getWindowScrollPosition');
var Path = require('../utils/Path');

function shouldUpdateScroll(state, prevState) {
  if (!prevState) {
    return true;
  }

  var path = state.path;
  var routes = state.routes;
  var prevPath = prevState.path;
  var prevRoutes = prevState.routes;

  if (Path.withoutQuery(path) === Path.withoutQuery(prevPath)) {
    return false;
  }

  var sharedAncestorRoutes = routes.filter(function (route) {
    return prevRoutes.indexOf(route) !== -1;
  });

  return !sharedAncestorRoutes.some(function (route) {
    return route.ignoreScrollBehavior;
  });
}

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

  componentDidUpdate: function (prevProps, prevState) {
    this._updateScroll(prevState);
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

  _updateScroll: function (prevState) {
    if (!shouldUpdateScroll(this.state, prevState)) {
      return;
    }

    var scrollBehavior = this.getScrollBehavior();

    if (scrollBehavior)
      scrollBehavior.updateScrollPosition(
        this.getScrollPosition(this.state.path),
        this.state.action
      );
  }

};

module.exports = Scrolling;
