'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _MatchProvider = require('./MatchProvider');

var _MatchProvider2 = _interopRequireDefault(_MatchProvider);

var _matchPattern = require('./matchPattern');

var _matchPattern2 = _interopRequireDefault(_matchPattern);

var _Broadcasts = require('./Broadcasts');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RegisterMatch = function (_React$Component) {
  _inherits(RegisterMatch, _React$Component);

  function RegisterMatch() {
    _classCallCheck(this, RegisterMatch);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  RegisterMatch.prototype.registerMatch = function registerMatch() {
    var matchContext = this.context.match;
    var match = this.props.match;


    if (match && matchContext) {
      matchContext.addMatch(match);
    }
  };

  RegisterMatch.prototype.componentWillMount = function componentWillMount() {
    if (this.context.serverRouter) {
      this.registerMatch();
    }
  };

  RegisterMatch.prototype.componentDidMount = function componentDidMount() {
    if (!this.context.serverRouter) {
      this.registerMatch();
    }
  };

  RegisterMatch.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    var match = this.context.match;


    if (match) {
      if (prevProps.match && !this.props.match) {
        match.removeMatch(prevProps.match);
      } else if (!prevProps.match && this.props.match) {
        match.addMatch(this.props.match);
      }
    }
  };

  RegisterMatch.prototype.componentWillUnmount = function componentWillUnmount() {
    if (this.props.match) {
      this.context.match.removeMatch(this.props.match);
    }
  };

  RegisterMatch.prototype.render = function render() {
    return _react2.default.Children.only(this.props.children);
  };

  return RegisterMatch;
}(_react2.default.Component);

RegisterMatch.contextTypes = {
  match: _react.PropTypes.object,
  serverRouter: _react.PropTypes.object
};


if (process.env.NODE_ENV !== 'production') {
  RegisterMatch.propTypes = {
    children: _react.PropTypes.node.isRequired,
    match: _react.PropTypes.any
  };
}

var Match = function (_React$Component2) {
  _inherits(Match, _React$Component2);

  function Match() {
    _classCallCheck(this, Match);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  Match.prototype.render = function render() {
    var _this3 = this;

    return _react2.default.createElement(
      _Broadcasts.LocationSubscriber,
      null,
      function (location) {
        var _props = _this3.props,
            children = _props.children,
            render = _props.render,
            Component = _props.component,
            pattern = _props.pattern,
            exactly = _props.exactly;
        var matchContext = _this3.context.match;

        var parent = matchContext && matchContext.parent;
        var match = (0, _matchPattern2.default)(pattern, location, exactly, parent);
        var props = _extends({}, match, { location: location, pattern: pattern });
        return _react2.default.createElement(
          RegisterMatch,
          { match: match },
          _react2.default.createElement(
            _MatchProvider2.default,
            { match: match },
            children ? children(_extends({ matched: !!match }, props)) : match ? render ? render(props) : _react2.default.createElement(Component, props) : null
          )
        );
      }
    );
  };

  return Match;
}(_react2.default.Component);

Match.defaultProps = {
  exactly: false
};
Match.contextTypes = {
  match: _react.PropTypes.object
};


if (process.env.NODE_ENV !== 'production') {
  Match.propTypes = {
    pattern: _react.PropTypes.string,
    exactly: _react.PropTypes.bool,

    children: _react.PropTypes.func,
    render: _react.PropTypes.func,
    component: _react.PropTypes.func
  };
}

exports.default = Match;