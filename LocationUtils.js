'use strict';

exports.__esModule = true;
exports.createRouterPath = exports.createRouterLocation = exports.locationsAreEqual = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _LocationUtils = require('history/LocationUtils');

Object.defineProperty(exports, 'locationsAreEqual', {
  enumerable: true,
  get: function get() {
    return _LocationUtils.locationsAreEqual;
  }
});

var _PathUtils = require('history/PathUtils');

var createRouterLocation = exports.createRouterLocation = function createRouterLocation(input, parseQueryString, stringifyQuery) {
  if (typeof input === 'string') {
    var location = (0, _PathUtils.parsePath)(input);
    location.query = location.search !== '' ? parseQueryString(location.search) : null;
    return location;
  } else {
    // got a location descriptor
    return {
      pathname: input.pathname || '',
      search: input.search || (input.query ? '?' + stringifyQuery(input.query) : ''),
      hash: input.hash || '',
      state: input.state || null,
      query: input.query || (input.search ? parseQueryString(input.search) : null),
      key: process.env.NODE_ENV === 'test' ? undefined : input.key
    };
  }
};

var createRouterPath = exports.createRouterPath = function createRouterPath(input, stringifyQuery) {
  return typeof input === 'string' ? input : (0, _PathUtils.createPath)(_extends({}, input, {
    search: input.search || (input.query ? '?' + stringifyQuery(input.query) : '')
  }));
};