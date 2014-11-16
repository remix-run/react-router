var React = require('react');

/**
 * An <RouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var RouteHandler = React.createClass({

  displayName: 'RouteHandler',

  contextTypes: {
    registerRouteHandlerElement: React.PropTypes.func.isRequired,
    unregisterRouteHandlerElement: React.PropTypes.func.isRequired,
    getRouteMatchAtDepth: React.PropTypes.func.isRequired
  },

  getDefaultProps: function () {
    return {
      ref: '__routeHandler__'
    };
  },

  getMatch: function () {
    return this.context.getRouteMatchAtDepth(this._routeDepth);
  },

  componentWillMount: function () {
    this._routeDepth = this.context.registerRouteHandlerElement(this);
  },

  componentDidMount: function () {
    this._updateMatchElement();
  },

  componentDidUpdate: function () {
    this._updateMatchElement();
  },

  _updateMatchElement: function () {
    this.getMatch().element = this.refs[this.props.ref];
  },

  componentWillUnmount: function () {
    this.context.unregisterRouteHandlerElement(this);
  },

  render: function () {
    var match = this.getMatch();
    return match ? React.createElement(match.route.handler, this.props) : null;
  }

});

module.exports = RouteHandler;
