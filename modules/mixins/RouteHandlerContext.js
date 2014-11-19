var React = require('react');
var invariant = require('react/lib/invariant');

/**
 * Provides the router with context for <RouteHandler> elements.
 */
var RouteHandlerContext = {

  pushRouteHandlerElement: function (element) {
    var elements = this.getElements();

    invariant(
      !elements.some(function (el) {
        return el._owner === element._owner
      }),
      'Using <RouteHandler> twice in the same render method is not allowed'
    );

    elements.push(element);

    return elements.length - 1;
  },

  popRouteHandlerElement: function (element) {
    var elements = this.getElements();

    // We assume here that elements are unmounted starting
    // at children. If that is incorrect, we need to revise.

    // TODO: Put this inside a __DEV__ guard. Right
    // now it's just a sanity check.
    invariant(
      elements[elements.length - 1] === element,
      'The <RouteHandler> stack is corrupt'
    );

    elements.pop();
  },

  getCurrentRouteAtDepth: function (depth) {
    return this.state.routes[depth];
  },

  childContextTypes: {
    pushRouteHandlerElement: React.PropTypes.func.isRequired,
    popRouteHandlerElement: React.PropTypes.func.isRequired,
    getCurrentRouteAtDepth: React.PropTypes.func.isRequired
  },

  getChildContext: function () {
    return {
      pushRouteHandlerElement: this.pushRouteHandlerElement,
      popRouteHandlerElement: this.popRouteHandlerElement,
      getCurrentRouteAtDepth: this.getCurrentRouteAtDepth
    };
  }

};

module.exports = RouteHandlerContext;
