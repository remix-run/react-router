var React = require('react');
var ChangeEmitter = require('./ChangeEmitter');

function routeIsActive(activeRoutes, routeName) {
  return activeRoutes.some(function (route) {
    return route.props.name === routeName;
  });
}

function paramsAreActive(activeParams, params) {
  for (var property in params) {
    if (activeParams[property] != params[property])
      return false;
  }

  return true;
}

function queryIsActive(activeQuery, query) {
  for (var property in query) {
    if (activeQuery[property] != query[property])
      return false;
  }

  return true;
}

/**
 * A mixin for components that store the active state of routes, URL
 * parameters, and query.
 */
var ActiveDelegate = {

  mixins: [ ChangeEmitter ],

  childContextTypes: {
    activeDelegate: React.PropTypes.any.isRequired
  },

  getChildContext: function () {
    return {
      activeDelegate: this
    };
  },

  /**
   * Returns true if the route with the given name, URL parameters, and
   * query are all currently active.
   */
  isActive: function (routeName, params, query) {
    var activeRoutes = this.state.activeRoutes || [];
    var activeParams = this.state.activeParams || {};
    var activeQuery = this.state.activeQuery || {};

    var isActive = routeIsActive(activeRoutes, routeName) && paramsAreActive(activeParams, params);

    if (query)
      return isActive && queryIsActive(activeQuery, query);

    return isActive;
  }

};

module.exports = ActiveDelegate;
