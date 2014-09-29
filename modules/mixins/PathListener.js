var LocationActions = require('../actions/LocationActions');
var DefaultLocation = require('../locations/DefaultLocation');
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var NoneStrategy = require('../strategies/NoneStrategy');
var ScrollToTopStrategy = require('../strategies/ScrollToTopStrategy');
var ImitateBrowserStrategy = require('../strategies/ImitateBrowserStrategy');
var PathStore = require('../stores/PathStore');
var ScrollStore = require('../stores/ScrollStore');

/**
 * A hash of { name, location } pairs.
 */
var NAMED_LOCATIONS = {
  hash: HashLocation,
  history: HistoryLocation,
  refresh: RefreshLocation
};

/**
 * A hash of { name, scrollStrategy } pairs.
 */
var NAMED_SCROLL_STRATEGIES = {
  none: NoneStrategy,
  scrollToTop: ScrollToTopStrategy,
  imitateBrowser: ImitateBrowserStrategy
};

/**
 * A mixin for components that listen for changes to the current
 * URL path.
 */
var PathListener = {

  propTypes: {
    location: function (props, propName, componentName) {
      var location = props[propName];

      if (typeof location === 'string' && !(location in NAMED_LOCATIONS))
        return new Error('Unknown location "' + location + '", see ' + componentName);
    },

    scrollStrategy: function (props, propName, componentName) {
      var scrollStrategy = props[propName];

      if (typeof scrollStrategy === 'string' && !(scrollStrategy in NAMED_SCROLL_STRATEGIES))
        return new Error('Unknown scrollStrategy "' + scrollStrategy + '", see ' + componentName);
    },
  },

  getDefaultProps: function () {
    return {
      location: DefaultLocation,
      scrollStrategy: ScrollToTopStrategy
    };
  },

  /**
   * Gets the location object this component uses to watch for
   * changes to the current URL path.
   */
  getLocation: function () {
    var location = this.props.location;

    if (typeof location === 'string')
      return NAMED_LOCATIONS[location];

    return location;
  },

  /**
   * Gets the scroll strategy object this component uses to
   * restore scroll position when the path changes.
   */
  getScrollStrategy: function () {
    var scrollStrategy = this.props.scrollStrategy;

    if (typeof scrollStrategy === 'string')
      return NAMED_SCROLL_STRATEGIES[scrollStrategy];

    return scrollStrategy;
  },

  componentWillMount: function () {
    ScrollStore.setup(this.getScrollStrategy());
    LocationActions.setup(this.getLocation());

    if (this.updatePath)
      this.updatePath(PathStore.getCurrentPath());
  },

  componentDidMount: function () {
    PathStore.addChangeListener(this.handlePathChange);
  },

  componentWillUnmount: function () {
    PathStore.removeChangeListener(this.handlePathChange);
    ScrollStore.teardown();
    LocationActions.teardown();
  },

  handlePathChange: function () {
    if (this.isMounted() && this.updatePath)
      this.updatePath(PathStore.getCurrentPath());
  }

};

module.exports = PathListener;
