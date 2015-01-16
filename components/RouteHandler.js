var React = require('react');
var RouteHandlerMixin = require('../mixins/RouteHandler');

/**
 * A <RouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var RouteHandler = React.createClass({

  displayName: 'RouteHandler',

  mixins: [RouteHandlerMixin],

  getDefaultProps: function () {
    return {
      ref: '__routeHandler__'
    };
  },

  render: function () {
    return this.getRouteHandler();
  }

});

module.exports = RouteHandler;
