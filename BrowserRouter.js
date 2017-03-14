'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createBrowserHistory = require('history/createBrowserHistory');

var _createBrowserHistory2 = _interopRequireDefault(_createBrowserHistory);

var _StaticRouter = require('./StaticRouter');

var _StaticRouter2 = _interopRequireDefault(_StaticRouter);

var _History = require('./History');

var _History2 = _interopRequireDefault(_History);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var BrowserRouter = function BrowserRouter(_ref) {
  var basename = _ref.basename,
      forceRefresh = _ref.forceRefresh,
      getUserConfirmation = _ref.getUserConfirmation,
      keyLength = _ref.keyLength,
      routerProps = _objectWithoutProperties(_ref, ['basename', 'forceRefresh', 'getUserConfirmation', 'keyLength']);

  return _react2.default.createElement(
    _History2.default,
    {
      createHistory: _createBrowserHistory2.default,
      historyOptions: {
        basename: basename,
        forceRefresh: forceRefresh,
        getUserConfirmation: getUserConfirmation,
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
        basename: basename,
        onPush: history.push,
        onReplace: history.replace,
        blockTransitions: history.block
      }, routerProps));
    }
  );
};

if (process.env.NODE_ENV !== 'production') {
  BrowserRouter.propTypes = {
    basename: _react.PropTypes.string,
    forceRefresh: _react.PropTypes.bool,
    getUserConfirmation: _react.PropTypes.func,
    keyLength: _react.PropTypes.number,
    children: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.node])
  };
}

exports.default = BrowserRouter;