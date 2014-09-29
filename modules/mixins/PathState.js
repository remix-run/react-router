var React = require('react');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var supportsHistory = require('../utils/supportsHistory');
var PathStore = require('../stores/PathStore');

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
 * that use it get two things:
 *
 *   1. An optional `location` prop that they use to track
 *      changes to the URL
 *   2. An `updatePath` method that is called when the
 *      current URL path changes
 *
 * Example:
 *
 *   var PathWatcher = React.createClass({
 *     
 *     mixins: [ Router.PathState ],
 *   
 *     updatePath: function (path, actionType) {
 *       this.setState({
 *         currentPath: path
 *       });
 *     }
 *   
 *   });
 */
var PathState = {

  propTypes: {

    fixedPath: React.PropTypes.string,

    location: function (props, propName, componentName) {
      var location = props[propName];

      if (typeof location === 'string' && !(location in NAMED_LOCATIONS))
        return new Error('Unknown location "' + location + '", see ' + componentName);
    }

  },

  getDefaultProps: function () {
    return {
      fixedPath: null,
      location: canUseDOM ? HashLocation : null
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

    invariant(
      this.props.fixedPath == null || this.getLocation() == null,
      'You cannot use a fixed path with a location. Choose one or the other'
    );

    if (location && location.setup)
      location.setup();

    if (this.updatePath)
      this.updatePath(this.getCurrentPath(), this.getCurrentActionType());
  },

  componentDidMount: function () {
    PathStore.addChangeListener(this.handlePathChange);
  },

  componentWillUnmount: function () {
    PathStore.removeChangeListener(this.handlePathChange);
  },

  handlePathChange: function () {
    if (this.isMounted() && this.updatePath)
      this.updatePath(this.getCurrentPath(), this.getCurrentActionType());
  },

  getCurrentPath: function () {
    return this.props.fixedPath || PathStore.getCurrentPath();
  },

  getCurrentActionType: function () {
    return PathStore.getCurrentActionType();
  }

};

module.exports = PathState;
