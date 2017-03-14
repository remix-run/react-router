'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createMemoryHistory = require('history/createMemoryHistory');

var _createMemoryHistory2 = _interopRequireDefault(_createMemoryHistory);

var _StaticRouter = require('./StaticRouter');

var _StaticRouter2 = _interopRequireDefault(_StaticRouter);

var _History = require('./History');

var _History2 = _interopRequireDefault(_History);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var MemoryRouter = function MemoryRouter(_ref) {
  var getUserConfirmation = _ref.getUserConfirmation,
      initialEntries = _ref.initialEntries,
      initialIndex = _ref.initialIndex,
      keyLength = _ref.keyLength,
      routerProps = _objectWithoutProperties(_ref, ['getUserConfirmation', 'initialEntries', 'initialIndex', 'keyLength']);

  return _react2.default.createElement(
    _History2.default,
    {
      createHistory: _createMemoryHistory2.default,
      historyOptions: {
        getUserConfirmation: getUserConfirmation,
        initialEntries: initialEntries,
        initialIndex: initialIndex,
        keyLength: keyLength
      }
    },
    function (_ref2) {
      var history = _ref2.history,
          action = _ref2.action,
          location = _ref2.location;
      return _react2.default.createElement(_StaticRouter2.default, _extends({
        action: action,
        location: location,
        onPush: history.push,
        onReplace: history.replace,
        blockTransitions: history.block
      }, routerProps));
    }
  );
};

if (process.env.NODE_ENV !== 'production') {
  MemoryRouter.propTypes = {
    getUserConfirmation: _react.PropTypes.func,
    initialEntries: _react.PropTypes.array,
    initialIndex: _react.PropTypes.number,
    keyLength: _react.PropTypes.number,
    children: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.node])
  };
}

exports.default = MemoryRouter;