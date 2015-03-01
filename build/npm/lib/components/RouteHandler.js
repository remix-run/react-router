"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = require("react");
var assign = require("react/lib/Object.assign");
var PropTypes = require("../PropTypes");

var REF_NAME = "__routeHandler__";

/**
 * A <RouteHandler> component renders the active child route handler
 * when routes are nested.
 */

var RouteHandler = (function (_React$Component) {
  function RouteHandler() {
    _classCallCheck(this, RouteHandler);

    if (_React$Component != null) {
      _React$Component.apply(this, arguments);
    }
  }

  _inherits(RouteHandler, _React$Component);

  _prototypeProperties(RouteHandler, null, {
    getChildContext: {
      value: function getChildContext() {
        return {
          routeHandlers: this.context.routeHandlers.concat([this])
        };
      },
      writable: true,
      configurable: true
    },
    componentDidMount: {
      value: function componentDidMount() {
        this._updateRouteComponent(this.refs[REF_NAME]);
      },
      writable: true,
      configurable: true
    },
    componentDidUpdate: {
      value: function componentDidUpdate() {
        this._updateRouteComponent(this.refs[REF_NAME]);
      },
      writable: true,
      configurable: true
    },
    componentWillUnmount: {
      value: function componentWillUnmount() {
        this._updateRouteComponent(null);
      },
      writable: true,
      configurable: true
    },
    _updateRouteComponent: {
      value: function _updateRouteComponent(component) {
        this.context.router.setRouteComponentAtDepth(this.getRouteDepth(), component);
      },
      writable: true,
      configurable: true
    },
    getRouteDepth: {
      value: function getRouteDepth() {
        return this.context.routeHandlers.length;
      },
      writable: true,
      configurable: true
    },
    createChildRouteHandler: {
      value: function createChildRouteHandler(props) {
        var route = this.context.router.getRouteAtDepth(this.getRouteDepth());
        return route ? React.createElement(route.handler, assign({}, props || this.props, { ref: REF_NAME })) : null;
      },
      writable: true,
      configurable: true
    },
    render: {
      value: function render() {
        return this.createChildRouteHandler();
      },
      writable: true,
      configurable: true
    }
  });

  return RouteHandler;
})(React.Component);

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
// https://github.com/babel/babel/issues/619

RouteHandler.contextTypes = {
  routeHandlers: PropTypes.array.isRequired,
  router: PropTypes.router.isRequired
};

RouteHandler.childContextTypes = {
  routeHandlers: PropTypes.array.isRequired
};

module.exports = RouteHandler;