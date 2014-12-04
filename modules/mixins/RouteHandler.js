var React = require('react');

module.exports = {
  contextTypes: {
    getRouteAtDepth: React.PropTypes.func.isRequired,
    getRouteComponents: React.PropTypes.func.isRequired,
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
    this._updateRouteComponent();
  },

  componentDidUpdate: function () {
    this._updateRouteComponent();
  },

  _updateRouteComponent: function () {
    var depth = this.getRouteDepth();
    var components = this.context.getRouteComponents();
    components[depth] = this.refs[this.props.ref || '__routeHandler__'];
  },

  getRouteHandler: function (props) {
    var route = this.context.getRouteAtDepth(this.getRouteDepth());
    return route ? React.createElement(route.handler, props || this.props) : null;
  }
};