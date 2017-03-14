'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _PropTypes = require('./PropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NavigationPrompt = function (_React$Component) {
  _inherits(NavigationPrompt, _React$Component);

  function NavigationPrompt() {
    _classCallCheck(this, NavigationPrompt);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  NavigationPrompt.prototype.block = function block() {
    if (!this.teardownPrompt) this.teardownPrompt = this.context.history.block(this.props.message);
  };

  NavigationPrompt.prototype.unblock = function unblock() {
    if (this.teardownPrompt) {
      this.teardownPrompt();
      this.teardownPrompt = null;
    }
  };

  NavigationPrompt.prototype.componentWillMount = function componentWillMount() {
    if (this.props.when) this.block();
  };

  NavigationPrompt.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    if (nextProps.when) {
      this.block();
    } else {
      this.unblock();
    }
  };

  NavigationPrompt.prototype.componentWillUnmount = function componentWillUnmount() {
    this.unblock();
  };

  NavigationPrompt.prototype.render = function render() {
    return null;
  };

  return NavigationPrompt;
}(_react2.default.Component);

NavigationPrompt.contextTypes = {
  history: _PropTypes.historyContext.isRequired
};
NavigationPrompt.defaultProps = {
  when: true
};


if (process.env.NODE_ENV !== 'production') {
  NavigationPrompt.propTypes = {
    when: _react.PropTypes.bool,
    message: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.string]).isRequired
  };
}

exports.default = NavigationPrompt;