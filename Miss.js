'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Broadcasts = require('./Broadcasts');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Miss = function (_React$Component) {
  _inherits(Miss, _React$Component);

  function Miss(props, context) {
    _classCallCheck(this, Miss);

    // ignore if rendered out of context (probably for unit tests)
    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props, context));

    if (context.match && !context.serverRouter) {
      _this.unsubscribe = _this.context.match.subscribe(function (matchesFound) {
        _this.setState({
          noMatchesInContext: !matchesFound
        });
      });
    }

    if (context.serverRouter) {
      context.serverRouter.registerMissPresence(context.match.serverRouterIndex);
    }

    _this.state = {
      noMatchesInContext: false
    };
    return _this;
  }

  Miss.prototype.componentWillUnmount = function componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  };

  Miss.prototype.render = function render() {
    var _this2 = this;

    return _react2.default.createElement(
      _Broadcasts.LocationSubscriber,
      null,
      function (location) {
        var _props = _this2.props,
            render = _props.render,
            Component = _props.component;
        var noMatchesInContext = _this2.state.noMatchesInContext;
        var _context = _this2.context,
            serverRouter = _context.serverRouter,
            match = _context.match;

        var noMatchesOnServerContext = serverRouter && serverRouter.missedAtIndex(match.serverRouterIndex);
        if (noMatchesInContext || noMatchesOnServerContext) {
          return render ? render({ location: location }) : _react2.default.createElement(Component, { location: location });
        } else {
          return null;
        }
      }
    );
  };

  return Miss;
}(_react2.default.Component);

Miss.contextTypes = {
  match: _react.PropTypes.object,
  serverRouter: _react.PropTypes.object
};


if (process.env.NODE_ENV !== 'production') {
  Miss.propTypes = {
    children: _react.PropTypes.node,
    render: _react.PropTypes.func,
    component: _react.PropTypes.func
  };
}

exports.default = Miss;