'use strict';

exports.__esModule = true;
exports.RouterContextMain = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactIs = require('react-is');

var _createReactClass = require('create-react-class');

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _propTypes = require('prop-types');

var _getRouteParams = require('./getRouteParams');

var _getRouteParams2 = _interopRequireDefault(_getRouteParams);

var _RouteUtils = require('./RouteUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RouterContextMain = exports.RouterContextMain = _react2.default.createContext({
  router: null
});

RouterContextMain.displayName = 'RouterContextMain';

/**
 * A <RouterContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */
var RouterContextWrapper = (0, _createReactClass2.default)({
  displayName: 'RouterContextWrapper',

  propTypes: {
    router: _propTypes.object.isRequired,
    location: _propTypes.object.isRequired,
    routes: _propTypes.array.isRequired,
    params: _propTypes.object.isRequired,
    components: _propTypes.array.isRequired,
    createElement: _propTypes.func.isRequired
  },

  getDefaultProps: function getDefaultProps() {
    return {
      createElement: _react2.default.createElement
    };
  },
  createElement: function createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props);
  },
  render: function render() {
    var _this = this;

    var _props = this.props,
        location = _props.location,
        routes = _props.routes,
        params = _props.params,
        components = _props.components,
        router = _props.router;

    var element = null;

    if (components) {
      element = components.reduceRight(function (element, components, index) {
        if (components == null) return element; // Don't create new children; use the grandchildren.

        var route = routes[index];
        var routeParams = (0, _getRouteParams2.default)(route, params);
        var props = {
          location: location,
          params: params,
          route: route,
          router: router,
          routeParams: routeParams,
          routes: routes
        };

        if ((0, _RouteUtils.isReactChildren)(element)) {
          props.children = element;
        } else if (element) {
          for (var prop in element) {
            if (Object.prototype.hasOwnProperty.call(element, prop)) props[prop] = element[prop];
          }
        }

        // Handle components is object for { [name]: component } but not valid element
        // type of react, such as React.memo, React.lazy and so on.
        if ((typeof components === 'undefined' ? 'undefined' : _typeof(components)) === 'object' && !(0, _reactIs.isValidElementType)(components)) {
          var elements = {};

          for (var key in components) {
            if (Object.prototype.hasOwnProperty.call(components, key)) {
              // Pass through the key as a prop to createElement to allow
              // custom createElement functions to know which named component
              // they're rendering, for e.g. matching up to fetched data.
              elements[key] = _this.createElement(components[key], _extends({
                key: key }, props));
            }
          }

          return elements;
        }

        return _this.createElement(components, props);
      }, element);
    }

    !(element === null || element === false || _react2.default.isValidElement(element)) ? process.env.NODE_ENV !== 'production' ? (0, _invariant2.default)(false, 'The root route must render a single element') : (0, _invariant2.default)(false) : void 0;

    return _react2.default.createElement(
      RouterContextMain.Provider,
      { value: { router: this.props.router } },
      _react2.default.createElement(
        _react2.default.Fragment,
        null,
        element
      )
    );
  }
});

exports.default = RouterContextWrapper;