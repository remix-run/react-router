var React = require('react');

/**
 * A <RouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var RouteHandler = React.createClass({

  displayName: 'RouteHandler',

  getDefaultProps: function () {
    return {
      ref: '__routeHandler__'
    };
  },

  contextTypes: {
    pushRouteHandlerElement: React.PropTypes.func.isRequired,
    popRouteHandlerElement: React.PropTypes.func.isRequired,
    getCurrentRouteAtDepth: React.PropTypes.func.isRequired
  },

  componentWillMount: function () {
    this._routeDepth = this.context.pushRouteHandlerElement(this);
  },

  componentWillUnmount: function () {
    this.context.popRouteHandlerElement(this);
  },

  /**
   * Returns the route handler's element.
   */
  getHandlerElement: function () {
    return this.refs[this.props.ref];
  },

  render: function () {
    var route = this.context.getCurrentRouteAtDepth(this._routeDepth);
    return route ? React.createElement(route.handler, this.props) : null;
  }

});

module.exports = RouteHandler;
