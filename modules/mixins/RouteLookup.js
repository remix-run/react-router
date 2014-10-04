var React = require('react');

/**
 * A mixin for components that need to lookup routes and/or
 * build URL paths and links.
 */
var RouteLookup = {

  contextTypes: {
    routeContainer: React.PropTypes.any.isRequired
  },

  /**
   * See RouteContainer#getRoutes.
   */
  getRoutes: function () {
    return this.context.routeContainer.getRoutes();
  },

  /**
   * See RouteContainer#getNamedRoutes.
   */
  getNamedRoutes: function () {
    return this.context.routeContainer.getNamedRoutes();
  },

  /**
   * See RouteContainer#getRouteByName.
   */
  getRouteByName: function (routeName) {
    return this.context.routeContainer.getRouteByName(routeName);
  }

};

module.exports = RouteLookup;
