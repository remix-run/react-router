var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var PathStore = require('../stores/PathStore');
var supportsHistory = require('../utils/supportsHistory');

/**
 * A hash of { name: location } pairs.
 */
var NAMED_LOCATIONS = {
  hash: HashLocation,
  history: HistoryLocation,
  refresh: RefreshLocation
};

/**
 * A mixin for components that need to know the current URL path. Components
 * that use it may specify a `location` prop that they use to track changes
 * to the URL. They also get:
 *
 *   1. An `updatePath` method that is called when the
 *      current URL path changes
 *   2. A `getCurrentPath` method they can use to get
 *      the current URL path
 *
 * Example:
 *
 *   var PathWatcher = React.createClass({
 *     
 *     mixins: [ Router.PathState ],
 *   
 *     getInitialState: function () {
 *       return {
 *         currentPath: this.getCurrentPath()
 *       };
 *     },
 *   
 *     updatePath: function () {
 *       this.setState({
 *         currentPath: this.getCurrentPath()
 *       });
 *     }
 *   
 *   });
 */
var PathState = {

  propTypes: {

    location: function (props, propName, componentName) {
      var location = props[propName];

      if (typeof location === 'string' && !(location in NAMED_LOCATIONS))
        return new Error('Unknown location "' + location + '", see ' + componentName);
    }

  },

  getDefaultProps: function () {
    return {
      location: canUseDOM ? HashLocation : null,
      path: null
    };
  },

  /**
   * Gets the location object this component uses to observe the URL.
   */
  getLocation: function () {
    var location = this.props.location;

    if (typeof location === 'string')
      location = NAMED_LOCATIONS[location];

    // Automatically fall back to full page refreshes in
    // browsers that do not support HTML5 history.
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;

    return location;
  },

  componentWillMount: function () {
    var location = this.getLocation();

    if (location && location.setup)
      location.setup();

    if (this.updatePath)
      this.updatePath(this.getCurrentPath(), this);
  },

  componentDidMount: function () {
    PathStore.addChangeListener(this.handlePathChange);
  },

  componentWillUnmount: function () {
    PathStore.removeChangeListener(this.handlePathChange);
  },

  handlePathChange: function (sender) {
    if (this.isMounted() && this.updatePath)
      this.updatePath(this.getCurrentPath(), sender);
  },

  /**
   * Returns the current URL path.
   */
  getCurrentPath: function () {
    return PathStore.getCurrentPath();
  }

};

module.exports = PathState;
