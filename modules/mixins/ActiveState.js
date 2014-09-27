var React = require('react');
var ActiveDelegate = require('./ActiveDelegate');

/**
 * A mixin for components that need to know about the routes, params,
 * and query that are currently active. Components that use it get two
 * things:
 *
 *   1. An `updateActiveState` method that is called when the
 *      active state changes.
 *   2. An `isActive` method they can use to check if a route,
 *      params, and query are active.
 *
 * Example:
 *
 *   var Tab = React.createClass({
 *     
 *     mixins: [ Router.ActiveState ],
 *
 *     getInitialState: function () {
 *       return {
 *         isActive: false
 *       };
 *     },
 *   
 *     updateActiveState: function () {
 *       this.setState({
 *         isActive: this.isActive(routeName, params, query)
 *       })
 *     }
 *   
 *   });
 */
var ActiveState = {

  contextTypes: {
    activeDelegate: React.PropTypes.any.isRequired
  },

  componentWillMount: function () {
    if (this.updateActiveState)
      this.updateActiveState();
  },

  componentDidMount: function () {
    this.context.activeDelegate.addChangeListener(this.handleActiveStateChange);
  },

  componentWillUnmount: function () {
    this.context.activeDelegate.removeChangeListener(this.handleActiveStateChange);
  },

  handleActiveStateChange: function () {
    if (this.isMounted() && this.updateActiveState)
      this.updateActiveState();
  },

  /**
   * Returns true if the route with the given name, URL parameters, and
   * query are all currently active.
   */
  isActive: function (routeName, params, query) {
    return this.context.activeDelegate.isActive(routeName, params, query);
  }

};

module.exports = ActiveState;
