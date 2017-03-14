'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _matchPattern = require('./matchPattern');

var _matchPattern2 = _interopRequireDefault(_matchPattern);

var _Miss = require('./Miss');

var _Miss2 = _interopRequireDefault(_Miss);

var _Broadcasts = require('./Broadcasts');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MatchGroup = function (_React$Component) {
  _inherits(MatchGroup, _React$Component);

  function MatchGroup() {
    _classCallCheck(this, MatchGroup);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  MatchGroup.prototype.findMatch = function findMatch(location) {
    var matchedIndex = void 0;
    var missIndex = void 0;

    var children = this.props.children;
    var matchContext = this.context.match;

    var parent = matchContext && matchContext.parent;

    _react.Children.forEach(children, function (child, index) {
      if (matchedIndex) {
        return;
      } else if (child.type === _Miss2.default) {
        missIndex = index;
      } else {
        var _child$props = child.props,
            pattern = _child$props.pattern,
            matchExactly = _child$props.exactly;

        if ((0, _matchPattern2.default)(pattern, location, matchExactly, parent)) {
          matchedIndex = index;
        }
      }
    });

    return { matchedIndex: matchedIndex, missIndex: missIndex };
  };

  MatchGroup.prototype.render = function render() {
    var _this2 = this;

    var children = this.props.children;


    return _react2.default.createElement(
      _Broadcasts.LocationSubscriber,
      null,
      function (location) {
        var _findMatch = _this2.findMatch(location),
            matchedIndex = _findMatch.matchedIndex,
            missIndex = _findMatch.missIndex;

        return matchedIndex != null ? children[matchedIndex] : missIndex ? children[missIndex] : null;
      }
    );
  };

  return MatchGroup;
}(_react2.default.Component);

MatchGroup.contextTypes = {
  match: _react.PropTypes.object
};


if (process.env.NODE_ENV !== 'production') {
  MatchGroup.propTypes = {
    children: _react.PropTypes.node.isRequired
  };
}

exports.default = MatchGroup;