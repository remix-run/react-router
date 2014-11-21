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
    getElements: React.PropTypes.func.isRequired,
    getRouteAtDepth: React.PropTypes.func.isRequired,
    routeHandlers: React.PropTypes.array.isRequired
  },

  childContextTypes: {
    routeHandlers: React.PropTypes.array.isRequired
  },

  getChildContext: function () {
    return {
      routeHandlers: this.context.routeHandlers.concat([ this ])
    };
  },

  getRouteDepth: function () {
    return this.context.routeHandlers.length - 1;
  },

  componentDidMount: function () {
    this._updateElement();
  },

  componentDidUpdate: function () {
    this._updateElement();
  },

  _updateElement: function () {
    var depth = this.getRouteDepth();
    var elements = this.context.getElements();
    elements[depth] = this.refs[this.props.ref];
  },

  render: function () {
    var route = this.context.getRouteAtDepth(this.getRouteDepth());
    return route ? React.createElement(route.handler, this.props) : null;
  }

});

module.exports = RouteHandler;
