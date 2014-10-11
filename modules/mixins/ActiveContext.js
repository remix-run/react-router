var React = require('react');
var copyProperties = require('react/lib/copyProperties');

/**
 * A mixin for components that store the active state of routes,
 * URL parameters, and query.
 */
var ActiveContext = {

  propTypes: {
    initialActiveRoutes: React.PropTypes.array.isRequired,
    initialActiveParams: React.PropTypes.object.isRequired,
    initialActiveQuery: React.PropTypes.object.isRequired
  },

  getDefaultProps: function () {
    return {
      initialActiveRoutes: [],
      initialActiveParams: {},
      initialActiveQuery: {}
    };
  },

  getInitialState: function () {
    return {
      activeRoutes: this.props.initialActiveRoutes,
      activeParams: this.props.initialActiveParams,
      activeQuery: this.props.initialActiveQuery
    };
  },

  /**
   * Returns a read-only array of the currently active routes.
   */
  getActiveRoutes: function () {
    return this.state.activeRoutes.slice(0);
  },

  /**
   * Returns a read-only object of the currently active URL parameters.
   */
  getActiveParams: function () {
    return copyProperties({}, this.state.activeParams);
  },

  /**
   * Returns a read-only object of the currently active query parameters.
   */
  getActiveQuery: function () {
    return copyProperties({}, this.state.activeQuery);
  },

  childContextTypes: {
    activeRoutes: React.PropTypes.array.isRequired,
    activeParams: React.PropTypes.object.isRequired,
    activeQuery: React.PropTypes.object.isRequired
  },

  getChildContext: function () {
    return {
      activeRoutes: this.getActiveRoutes(),
      activeParams: this.getActiveParams(),
      activeQuery: this.getActiveQuery()
    };
  }

};

module.exports = ActiveContext;
