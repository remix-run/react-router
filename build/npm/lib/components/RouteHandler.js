"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = require("react");
var ContextWrapper = require("./ContextWrapper");
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

  _createClass(RouteHandler, {
    getChildContext: {
      value: function getChildContext() {
        return {
          routeDepth: this.context.routeDepth + 1
        };
      }
    },
    componentDidMount: {
      value: function componentDidMount() {
        this._updateRouteComponent(this.refs[REF_NAME]);
      }
    },
    componentDidUpdate: {
      value: function componentDidUpdate() {
        this._updateRouteComponent(this.refs[REF_NAME]);
      }
    },
    componentWillUnmount: {
      value: function componentWillUnmount() {
        this._updateRouteComponent(null);
      }
    },
    _updateRouteComponent: {
      value: function _updateRouteComponent(component) {
        this.context.router.setRouteComponentAtDepth(this.getRouteDepth(), component);
      }
    },
    getRouteDepth: {
      value: function getRouteDepth() {
        return this.context.routeDepth;
      }
    },
    createChildRouteHandler: {
      value: function createChildRouteHandler(props) {
        var route = this.context.router.getRouteAtDepth(this.getRouteDepth());
        return route ? React.createElement(route.handler, assign({}, props || this.props, { ref: REF_NAME })) : null;
      }
    },
    render: {
      value: function render() {
        var handler = this.createChildRouteHandler();
        // <script/> for things like <CSSTransitionGroup/> that don't like null
        return handler ? React.createElement(
          ContextWrapper,
          null,
          handler
        ) : React.createElement("script", null);
      }
    }
  });

  return RouteHandler;
})(React.Component);

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
// https://github.com/babel/babel/issues/619

RouteHandler.contextTypes = {
  routeDepth: PropTypes.number.isRequired,
  router: PropTypes.router.isRequired
};

RouteHandler.childContextTypes = {
  routeDepth: PropTypes.number.isRequired
};

module.exports = RouteHandler;