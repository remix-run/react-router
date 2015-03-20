"use strict";

var warning = require("react/lib/warning");
var PropTypes = require("./PropTypes");

function deprecatedMethod(routerMethodName, fn) {
  return function () {
    warning(false, "Router.State is deprecated. Please use this.context.router." + routerMethodName + "() instead");

    return fn.apply(this, arguments);
  };
}

/**
 * A mixin for components that need to know the path, routes, URL
 * params and query that are currently active.
 *
 * Example:
 *
 *   var AboutLink = React.createClass({
 *     mixins: [ Router.State ],
 *     render() {
 *       var className = this.props.className;
 *   
 *       if (this.isActive('about'))
 *         className += ' is-active';
 *   
 *       return React.DOM.a({ className: className }, this.props.children);
 *     }
 *   });
 */
var State = {

  contextTypes: {
    router: PropTypes.router.isRequired
  },

  /**
   * Returns the current URL path.
   */
  getPath: deprecatedMethod("getCurrentPath", function () {
    return this.context.router.getCurrentPath();
  }),

  /**
   * Returns the current URL path without the query string.
   */
  getPathname: deprecatedMethod("getCurrentPathname", function () {
    return this.context.router.getCurrentPathname();
  }),

  /**
   * Returns an object of the URL params that are currently active.
   */
  getParams: deprecatedMethod("getCurrentParams", function () {
    return this.context.router.getCurrentParams();
  }),

  /**
   * Returns an object of the query params that are currently active.
   */
  getQuery: deprecatedMethod("getCurrentQuery", function () {
    return this.context.router.getCurrentQuery();
  }),

  /**
   * Returns an array of the routes that are currently active.
   */
  getRoutes: deprecatedMethod("getCurrentRoutes", function () {
    return this.context.router.getCurrentRoutes();
  }),

  /**
   * A helper method to determine if a given route, params, and query
   * are active.
   */
  isActive: deprecatedMethod("isActive", function (to, params, query) {
    return this.context.router.isActive(to, params, query);
  })

};

module.exports = State;