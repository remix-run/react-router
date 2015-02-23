"use strict";

var React = require("react");
var RouteHandlerMixin = require("../RouteHandlerMixin");

/**
 * A <RouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var RouteHandler = React.createClass({

  displayName: "RouteHandler",

  mixins: [RouteHandlerMixin],

  render: function render() {
    return this.createChildRouteHandler();
  }

});

module.exports = RouteHandler;