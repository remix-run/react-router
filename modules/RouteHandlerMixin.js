var React = require('react');
var assign = require('react/lib/Object.assign');
var PropTypes = require('./PropTypes');

var REF_NAME = '__routeHandler__';

var RouteHandlerMixin = {

  contextTypes: {
    getRouteAtDepth: PropTypes.func.isRequired,
    setRouteComponentAtDepth: PropTypes.func.isRequired,
    routeHandlers: PropTypes.array.isRequired
  },

  childContextTypes: {
    routeHandlers: PropTypes.array.isRequired
  },

  getChildContext: function () {
    return {
      routeHandlers: this.context.routeHandlers.concat([ this ])
    };
  },

  componentDidMount: function () {
    this._updateRouteComponent();
  },

  componentDidUpdate: function () {
    this._updateRouteComponent();
  },

  componentWillUnmount: function () {
    this.context.setRouteComponentAtDepth(this.getRouteDepth(), null);
  },

  _updateRouteComponent: function () {
    this.context.setRouteComponentAtDepth(this.getRouteDepth(), this.refs[REF_NAME]);
  },

  getRouteDepth: function () {
    return this.context.routeHandlers.length;
  },

  createChildRouteHandler: function (props) {
    var route = this.context.getRouteAtDepth(this.getRouteDepth());
    return route ? React.createElement(route.handler, assign({}, props || this.props, { ref: REF_NAME })) : null;
  }

};

module.exports = RouteHandlerMixin;
