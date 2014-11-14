var React = require('react');

/**
 * An <ActiveRouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var ActiveRouteHandler = React.createClass({

  contextTypes: {
    registerActiveRouteHandlerElement: React.PropTypes.func.isRequired,
    unregisterActiveRouteHandlerElement: React.PropTypes.func.isRequired,
    getRouteMatchAtDepth: React.PropTypes.func.isRequired
  },

  getDefaultProps: function () {
    return {
      ref: '__activeRouteHandler__'
    };
  },

  getMatch: function () {
    return this.context.getRouteMatchAtDepth(this._routeDepth);
  },

  componentWillMount: function () {
    this._routeDepth = this.context.registerActiveRouteHandlerElement(this);
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
    this.context.unregisterActiveRouteHandlerElement(this);
  },

  render: function () {
    var match = this.getMatch();

    if (!match)
      return null;

    return React.createElement(match.route.handler, this.props);
  }

});

module.exports = ActiveRouteHandler;
