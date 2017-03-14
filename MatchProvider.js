'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _PropTypes = require('./PropTypes');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MatchProvider = function (_React$Component) {
  _inherits(MatchProvider, _React$Component);

  function MatchProvider(props) {
    _classCallCheck(this, MatchProvider);

    // **IMPORTANT** we must mutate matches, never reassign, in order for
    // server rendering to work w/ the two-pass render approach for Miss
    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

    _this.addMatch = function (match) {
      _this.matches.push(match);
    };

    _this.removeMatch = function (match) {
      _this.matches.splice(_this.matches.indexOf(match), 1);
    };

    _this.matches = [];
    _this.subscribers = [];
    _this.hasMatches = null; // use null for initial value
    _this.serverRouterIndex = null;
    return _this;
  }

  MatchProvider.prototype.getChildContext = function getChildContext() {
    var _this2 = this;

    return {
      match: {
        addMatch: this.addMatch,
        removeMatch: this.removeMatch,
        matches: this.matches,
        parent: this.props.match,
        serverRouterIndex: this.serverRouterIndex,
        subscribe: function subscribe(fn) {
          _this2.subscribers.push(fn);
          return function () {
            _this2.subscribers.splice(_this2.subscribers.indexOf(fn), 1);
          };
        }
      }
    };
  };

  MatchProvider.prototype.componentDidUpdate = function componentDidUpdate() {
    this.notifySubscribers();
  };

  MatchProvider.prototype.componentWillMount = function componentWillMount() {
    var serverRouter = this.context.serverRouter;

    if (serverRouter) {
      this.serverRouterIndex = serverRouter.registerMatchContext(this.matches);
    }
  };

  MatchProvider.prototype.componentDidMount = function componentDidMount() {
    // React's contract is that cDM of descendants is called before cDM of
    // ancestors, so here we can safely check if we found a match
    this.notifySubscribers();
  };

  MatchProvider.prototype.notifySubscribers = function notifySubscribers() {
    var _this3 = this;

    if (this.subscribers.length) {
      this.hasMatches = this.matches.length !== 0;
      this.subscribers.forEach(function (fn) {
        return fn(_this3.hasMatches);
      });
    }
  };

  MatchProvider.prototype.render = function render() {
    return this.props.children;
  };

  return MatchProvider;
}(_react2.default.Component);

MatchProvider.childContextTypes = {
  match: _PropTypes.matchContext.isRequired
};
MatchProvider.contextTypes = {
  serverRouter: _react.PropTypes.object
};


if (process.env.NODE_ENV !== 'production') {
  MatchProvider.propTypes = {
    match: _react.PropTypes.any,
    children: _react.PropTypes.node
  };
}

exports.default = MatchProvider;