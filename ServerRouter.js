'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _StaticRouter = require('./StaticRouter');

var _StaticRouter2 = _interopRequireDefault(_StaticRouter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ServerRouter = function (_React$Component) {
  _inherits(ServerRouter, _React$Component);

  function ServerRouter() {
    _classCallCheck(this, ServerRouter);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  ServerRouter.prototype.getChildContext = function getChildContext() {
    return {
      serverRouter: this.props.context
    };
  };

  ServerRouter.prototype.render = function render() {
    var _props = this.props,
        context = _props.context,
        location = _props.location,
        basename = _props.basename,
        rest = _objectWithoutProperties(_props, ['context', 'location', 'basename']);

    var redirect = function redirect(location) {
      context.setRedirect(location);
    };
    return _react2.default.createElement(_StaticRouter2.default, _extends({
      action: 'POP',
      location: location,
      basename: basename,
      onReplace: redirect,
      onPush: redirect
    }, rest));
  };

  return ServerRouter;
}(_react2.default.Component);

ServerRouter.childContextTypes = {
  serverRouter: _react.PropTypes.object.isRequired
};


if (process.env.NODE_ENV !== 'production') {
  ServerRouter.propTypes = {
    basename: _react.PropTypes.string,
    context: _react.PropTypes.object.isRequired,
    location: _react.PropTypes.string.isRequired,
    children: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.node])
  };
}

exports.default = ServerRouter;