"use strict";

var React = require("react");
var assign = require("react/lib/Object.assign");
var PropTypes = require("./PropTypes");

var REF_NAME = "__routeHandler__";

var RouteHandlerMixin = {

  contextTypes: {
    getRouteAtDepth: PropTypes.func.isRequired,
    setRouteComponentAtDepth: PropTypes.func.isRequired,
    routeHandlers: PropTypes.array.isRequired
  },

  childContextTypes: {
    routeHandlers: PropTypes.array.isRequired
  },

  getChildContext: function getChildContext() {
    return {
      routeHandlers: this.context.routeHandlers.concat([this])
    };
  },

  componentDidMount: function componentDidMount() {
    this._updateRouteComponent(this.refs[REF_NAME]);
  },

  componentDidUpdate: function componentDidUpdate() {
    this._updateRouteComponent(this.refs[REF_NAME]);
  },

  componentWillUnmount: function componentWillUnmount() {
    this._updateRouteComponent(null);
  },

  _updateRouteComponent: function _updateRouteComponent(component) {
    this.context.setRouteComponentAtDepth(this.getRouteDepth(), component);
  },

  getRouteDepth: function getRouteDepth() {
    return this.context.routeHandlers.length;
  },

  createChildRouteHandler: function createChildRouteHandler(props) {
    var route = this.context.getRouteAtDepth(this.getRouteDepth());
    return route ? React.createElement(route.handler, assign({}, props || this.props, { ref: REF_NAME })) : null;
  }

};

module.exports = RouteHandlerMixin;