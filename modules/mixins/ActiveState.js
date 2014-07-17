var ActiveStore = require('../stores/ActiveStore');

function routeIsActive(activeRoutes, routeName) {
  return activeRoutes.some(function (route) {
    return route.props.name === routeName;
  });
}

function paramsAreActive(activeParams, params) {
  for (var property in params) {
    if (activeParams[property] !== String(params[property]))
      return false;
  }

  return true;
}

function queryIsActive(activeQuery, query) {
  for (var property in query) {
    if (activeQuery[property] !== String(query[property]))
      return false;
  }

  return true;
}

/**
 * A mixin for components that need to know about the routes, params,
 * and query that are currently active. Components that use it get two
 * things:
 *
 *   1. An `isActive` static method they can use to check if a route,
 *      params, and query are active.
 *   2. An `updateActiveState` instance method that is called when the
 *      active state changes.
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
 *         isActive: Tab.isActive(routeName, params, query)
 *       })
 *     }
 *   
 *   });
 */
var ActiveState = {

  statics: {

    /**
     * Returns true if the route with the given name, URL parameters, and query
     * are all currently active.
     */
    isActive: function (routeName, params, query) {
      var state = ActiveStore.getState();
      var isActive = routeIsActive(state.routes, routeName) && paramsAreActive(state.params, params);

      if (query)
        return isActive && queryIsActive(state.query, query);

      return isActive;
    }

  },

  componentWillMount: function () {
    ActiveStore.addChangeListener(this.handleActiveStateChange);
  },

  componentDidMount: function () {
    if (this.updateActiveState)
      this.updateActiveState();
  },

  componentWillUnmount: function () {
    ActiveStore.removeChangeListener(this.handleActiveStateChange);
  },

  handleActiveStateChange: function () {
    if (this.isMounted() && this.updateActiveState)
      this.updateActiveState();
  }

};

module.exports = ActiveState;
