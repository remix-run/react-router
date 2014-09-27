var React = require('react');

/**
 * A mixin for components that need to lookup routes and/or
 * build URL paths and links.
 */
var RouteLookup = {

  contextTypes: {
    routeContainer: React.PropTypes.any.isRequired,
    pathDelegate: React.PropTypes.any.isRequired
  },

  /**
   * See RouteContainer#getRoutes.
   */
  getRoutes: function () {
    return this.context.routeContainer.getRoutes();
  },

  /**
   * See RouteContainer#getRouteByName.
   */
  getRouteByName: function (routeName) {
    return this.context.routeContainer.getRouteByName(routeName);
  },

  /**
   * See PathDelegate#makePath.
   */
  makePath: function (to, params, query) {
    return this.context.pathDelegate.makePath(to, params, query);
  },

  /**
   * See PathDelegate#makeHref.
   */
  makeHref: function (to, params, query) {
    return this.context.pathDelegate.makeHref(to, params, query);
  }

};

module.exports = RouteLookup;
