var React = require('react');
var withoutProperties = require('../utils/withoutProperties');

/**
 * A map of <Route> component props that are reserved for use by the
 * router and/or React. All other props are considered "static" and
 * are passed through to the route handler.
 */
var RESERVED_PROPS = {
  handler: true,
  path: true,
  defaultRoute: true,
  notFoundRoute: true,
  paramNames: true,
  children: true // ReactChildren
};

var ConfigRoute = {

  propTypes: {
    handler: React.PropTypes.any.isRequired,
    path: React.PropTypes.string,
    name: React.PropTypes.string
  },

  statics: {
    getUnreservedProps: function (props) {
      return withoutProperties(props, RESERVED_PROPS);
    }
  },

  render: function () {
    throw new Error('Route config components should not be rendered.');
  }

};

module.exports = ConfigRoute;

