var React = require('react');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var supportsHistory = require('../utils/supportsHistory');

/**
 * A hash of { name: location } pairs.
 */
var NAMED_LOCATIONS = {
  none: null,
  hash: HashLocation,
  history: HistoryLocation,
  refresh: RefreshLocation
};

/**
 * A mixin for components that manage location.
 */
var LocationContext = {

  propTypes: {
    location: function (props, propName, componentName) {
      var location = props[propName];

      if (typeof location === 'string' && !(location in NAMED_LOCATIONS))
        return new Error('Unknown location "' + location + '", see ' + componentName);
    }
  },

  getDefaultProps: function () {
    return {
      location: canUseDOM ? HashLocation : null
    };
  },

  getInitialState: function () {
    var location = this.props.location;

    if (typeof location === 'string')
      location = NAMED_LOCATIONS[location];

    // Automatically fall back to full page refreshes in
    // browsers that do not support HTML5 history.
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;

    return {
      location: location
    };
  },

  componentWillMount: function () {
    var location = this.getLocation();

    invariant(
      location == null || canUseDOM,
      'Cannot use location without a DOM'
    );

    if (location && location.setup)
      location.setup();
  },

  /**
   * Returns the location object this component uses.
   */
  getLocation: function () {
    return this.state.location;
  },

  childContextTypes: {
    location: React.PropTypes.object // Not required on the server.
  },

  getChildContext: function () {
    return {
      location: this.getLocation()
    };
  }

};

module.exports = LocationContext;
