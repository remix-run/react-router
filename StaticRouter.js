'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _queryString = require('query-string');

var _MatchProvider = require('./MatchProvider');

var _MatchProvider2 = _interopRequireDefault(_MatchProvider);

var _Broadcasts = require('./Broadcasts');

var _LocationUtils = require('./LocationUtils');

var _PropTypes = require('./PropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var stringifyQuery = function stringifyQuery(query) {
  return (0, _queryString.stringify)(query).replace(/%20/g, '+');
};

var StaticRouter = function (_React$Component) {
  _inherits(StaticRouter, _React$Component);

  function StaticRouter() {
    var _temp, _this, _ret;

    _classCallCheck(this, StaticRouter);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _React$Component.call.apply(_React$Component, [this].concat(args))), _this), _this.transitionTo = function (location) {
      _this.props.onPush(_this.createLocation(location));
    }, _this.replaceWith = function (location) {
      _this.props.onReplace(_this.createLocation(location));
    }, _this.blockTransitions = function (prompt) {
      return _this.props.blockTransitions(prompt);
    }, _this.createHref = function (to) {
      var path = (0, _LocationUtils.createRouterPath)(to, _this.props.stringifyQuery);

      if (_this.props.basename) if (path === '/') path = _this.props.basename;else if (path.length >= 2 && path.charAt(0) === '/' && path.charAt(1) === '?') path = _this.props.basename + path.substring(1);else path = _this.props.basename + path;

      return _this.props.createHref(path);
    }, _this.state = {
      location: null
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  StaticRouter.prototype.createLocation = function createLocation(location) {
    var _props = this.props,
        parseQueryString = _props.parseQueryString,
        stringifyQuery = _props.stringifyQuery;

    return (0, _LocationUtils.createRouterLocation)(location, parseQueryString, stringifyQuery);
  };

  StaticRouter.prototype.getRouterContext = function getRouterContext() {
    return {
      transitionTo: this.transitionTo,
      replaceWith: this.replaceWith,
      blockTransitions: this.blockTransitions,
      createHref: this.createHref
    };
  };

  StaticRouter.prototype.getChildContext = function getChildContext() {
    return {
      router: this.getRouterContext()
    };
  };

  StaticRouter.prototype.componentWillMount = function componentWillMount() {
    this.setState({
      location: this.createLocation(this.props.location)
    });
  };

  StaticRouter.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    var nextLocation = this.createLocation(nextProps.location);

    if (!(0, _LocationUtils.locationsAreEqual)(this.state.location, nextLocation)) this.setState({ location: nextLocation });
  };

  StaticRouter.prototype.render = function render() {
    var location = this.state.location;
    var _props2 = this.props,
        action = _props2.action,
        children = _props2.children;


    return _react2.default.createElement(
      _Broadcasts.LocationBroadcast,
      { value: location },
      _react2.default.createElement(
        _MatchProvider2.default,
        null,
        typeof children === 'function' ? children({ action: action, location: location, router: this.getRouterContext() }) : _react2.default.Children.only(children)
      )
    );
  };

  return StaticRouter;
}(_react2.default.Component);

StaticRouter.defaultProps = {
  stringifyQuery: stringifyQuery,
  parseQueryString: _queryString.parse,
  createHref: function createHref(path) {
    return path;
  }
};
StaticRouter.childContextTypes = {
  router: _PropTypes.routerContext.isRequired
};


if (process.env.NODE_ENV !== 'production') {
  StaticRouter.propTypes = {
    children: _react.PropTypes.oneOfType([_react.PropTypes.node, _react.PropTypes.func]),

    action: _PropTypes.action.isRequired,
    location: _react.PropTypes.oneOfType([_react.PropTypes.object, _react.PropTypes.string]).isRequired,

    onPush: _react.PropTypes.func.isRequired,
    onReplace: _react.PropTypes.func.isRequired,
    blockTransitions: _react.PropTypes.func,

    stringifyQuery: _react.PropTypes.func.isRequired,
    parseQueryString: _react.PropTypes.func.isRequired,
    createHref: _react.PropTypes.func.isRequired, // TODO: Clarify why this is useful

    basename: _react.PropTypes.string // TODO: Feels like we should be able to remove this
  };
}

exports.default = StaticRouter;