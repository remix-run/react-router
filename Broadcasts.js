'use strict';

exports.__esModule = true;
exports.LocationSubscriber = exports.LocationBroadcast = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactBroadcast = require('react-broadcast');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LocationChannel = 'location';

var LocationBroadcast = exports.LocationBroadcast = function LocationBroadcast(props) {
  return _react2.default.createElement(_reactBroadcast.Broadcast, _extends({}, props, { channel: LocationChannel }));
};

var LocationSubscriber = exports.LocationSubscriber = function LocationSubscriber(props) {
  return _react2.default.createElement(_reactBroadcast.Subscriber, _extends({}, props, { channel: LocationChannel }));
};