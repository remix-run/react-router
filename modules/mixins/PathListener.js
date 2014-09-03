var React = require('react');
var DefaultLocation = require('../locations/DefaultLocation');
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var PathStore = require('../stores/PathStore');

/**
 * A hash of { name, location } pairs.
 */
var NAMED_LOCATIONS = {
  hash: HashLocation,
  history: HistoryLocation,
  refresh: RefreshLocation
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
    }
  },

  getDefaultProps: function () {
    return {
      location: DefaultLocation
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

  componentWillMount: function () {
    PathStore.setup(this.getLocation());
  },

  componentDidMount: function () {
    PathStore.addChangeListener(this.handlePathChange);
    this.handlePathChange();
  },

  componentWillUnmount: function () {
    PathStore.removeChangeListener(this.handlePathChange);
  },

  handlePathChange: function () {
    if (this.isMounted() && this.updatePath)
      this.updatePath(PathStore.getCurrentPath());
  }

};

module.exports = PathListener;
