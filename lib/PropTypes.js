'use strict';

exports.__esModule = true;
exports.locationShape = exports.routerShape = undefined;

var _propTypes = require('prop-types');

var routerShape = exports.routerShape = (0, _propTypes.shape)({
  push: _propTypes.func.isRequired,
  replace: _propTypes.func.isRequired,
  go: _propTypes.func.isRequired,
  goBack: _propTypes.func.isRequired,
  goForward: _propTypes.func.isRequired,
  setRouteLeaveHook: _propTypes.func.isRequired,
  isActive: _propTypes.func.isRequired
});

var locationShape = exports.locationShape = (0, _propTypes.shape)({
  pathname: _propTypes.string.isRequired,
  search: _propTypes.string.isRequired,
  state: _propTypes.object,
  action: _propTypes.string.isRequired,
  key: _propTypes.string
});