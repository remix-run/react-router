var React = require('react');

/**
 * A mixin for components that need to know the routes, URL
 * params and query that are currently active.
 *
 * Example:
 *
 *   var AboutLink = React.createClass({
 *     mixins: [ Router.ActiveState ],
 *     render: function () {
 *       var className = this.props.className;
 *   
 *       if (this.isActive('about'))
 *         className += ' is-active';
 *   
 *       return React.DOM.a({ className: className }, this.props.children);
 *     }
 *   });
 */
var ActiveState = {

  contextTypes: {
    activeRoutes: React.PropTypes.array.isRequired,
    activeParams: React.PropTypes.object.isRequired,
    activeQuery: React.PropTypes.object.isRequired,
    isActive: React.PropTypes.func.isRequired
  },

  /**
   * Returns an array of the routes that are currently active.
   */
  getActiveRoutes: function () {
    return this.context.activeRoutes;
  },

  /**
   * Returns an object of the URL params that are currently active.
   */
  getActiveParams: function () {
    return this.context.activeParams;
  },

  /**
   * Returns an object of the query params that are currently active.
   */
  getActiveQuery: function () {
    return this.context.activeQuery;
  },

  /**
   * A helper method to determine if a given route, params, and query
   * are active.
   */
  isActive: function (to, params, query) {
    return this.context.isActive(to, params, query);
  }

};

module.exports = ActiveState;
