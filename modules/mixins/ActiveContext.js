var React = require('react');
var copyProperties = require('react/lib/copyProperties');

function routeIsActive(activeRoutes, routeName) {
  return activeRoutes.some(function (route) {
    return route.props.name === routeName;
  });
}

function paramsAreActive(activeParams, params) {
  for (var property in params)
    if (String(activeParams[property]) !== String(params[property]))
      return false;

  return true;
}

function queryIsActive(activeQuery, query) {
  for (var property in query)
    if (String(activeQuery[property]) !== String(query[property]))
      return false;

  return true;
}

/**
 * A mixin for components that store the active state of routes, URL
 * parameters, and query.
 */
var ActiveContext = {

  propTypes: {
    initialActiveState: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      initialActiveState: {}
    };
  },

  getInitialState: function () {
    var state = this.props.initialActiveState;

    return {
      activeRoutes: state.activeRoutes || [],
      activeParams: state.activeParams || {},
      activeQuery: state.activeQuery || {}
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

  /**
   * Returns true if the route with the given name, URL parameters, and
   * query are all currently active.
   */
  isActive: function (routeName, params, query) {
    var isActive = routeIsActive(this.state.activeRoutes, routeName) &&
                   paramsAreActive(this.state.activeParams, params);

    if (query)
      return isActive && queryIsActive(this.state.activeQuery, query);

    return isActive;
  },

  childContextTypes: {
    activeRoutes: React.PropTypes.array.isRequired,
    activeParams: React.PropTypes.object.isRequired,
    activeQuery: React.PropTypes.object.isRequired,
    isActive: React.PropTypes.func.isRequired
  },

  getChildContext: function () {
    return {
      activeRoutes: this.getActiveRoutes(),
      activeParams: this.getActiveParams(),
      activeQuery: this.getActiveQuery(),
      isActive: this.isActive
    };
  }

};

module.exports = ActiveContext;
