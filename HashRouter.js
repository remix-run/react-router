'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createHashHistory = require('history/createHashHistory');

var _createHashHistory2 = _interopRequireDefault(_createHashHistory);

var _History = require('./History');

var _History2 = _interopRequireDefault(_History);

var _PathUtils = require('history/PathUtils');

var _StaticRouter = require('./StaticRouter');

var _StaticRouter2 = _interopRequireDefault(_StaticRouter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var createHref = function createHref(hashType) {
  return function (path) {
    var newPath = void 0;

    switch (hashType) {
      case 'hashbang':
        newPath = path.charAt(0) === '!' ? path : '!/' + (0, _PathUtils.stripLeadingSlash)(path);
        break;
      case 'noslash':
        newPath = (0, _PathUtils.stripLeadingSlash)(path);
        break;
      case 'slash':
      default:
        newPath = (0, _PathUtils.addLeadingSlash)(path);
        break;
    }

    return '#' + newPath;
  };
};

/**
 * A router that uses the URL hash.
 */
var HashRouter = function HashRouter(_ref) {
  var basename = _ref.basename,
      getUserConfirmation = _ref.getUserConfirmation,
      hashType = _ref.hashType,
      routerProps = _objectWithoutProperties(_ref, ['basename', 'getUserConfirmation', 'hashType']);

  return _react2.default.createElement(
    _History2.default,
    {
      createHistory: _createHashHistory2.default,
      historyOptions: {
        basename: basename,
        getUserConfirmation: getUserConfirmation,
        hashType: hashType
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
        blockTransitions: history.block,
        createHref: createHref(hashType)
      }, routerProps));
    }
  );
};

if (process.env.NODE_ENV !== 'production') {
  HashRouter.propTypes = {
    basename: _react.PropTypes.string,
    getUserConfirmation: _react.PropTypes.func,
    hashType: _react.PropTypes.string,
    children: _react.PropTypes.oneOfType([_react.PropTypes.func, _react.PropTypes.node])
  };
}

exports.default = HashRouter;