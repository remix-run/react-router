'use strict';

exports.__esModule = true;

var _pathToRegexp = require('path-to-regexp');

var _pathToRegexp2 = _interopRequireDefault(_pathToRegexp);

var _MatcherCache = require('./MatcherCache');

var _MatcherCache2 = _interopRequireDefault(_MatcherCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// cache[exactly][pattern] contains getMatcher(pattern, exactly)
var cache = {
  true: new _MatcherCache2.default(),
  false: new _MatcherCache2.default()
};

var getMatcher = function getMatcher(pattern, exactly) {
  var exactlyStr = exactly ? 'true' : 'false';
  var matcher = cache[exactlyStr].get(pattern);

  if (!matcher) {
    var keys = [];
    var regex = (0, _pathToRegexp2.default)(pattern, keys, { end: exactly, strict: true });
    matcher = { keys: keys, regex: regex };
    cache[exactlyStr].set(pattern, matcher);
  }

  return matcher;
};

var parseParams = function parseParams(pattern, match, keys) {
  return match.slice(1).filter(function (value) {
    return value !== undefined;
  }).reduce(function (params, value, index) {
    params[keys[index].name] = decodeURIComponent(value);
    return params;
  }, {});
};

var matchPattern = function matchPattern(pattern, location, matchExactly, parent) {
  var specialCase = !matchExactly && pattern === '/';

  if (specialCase) {
    return {
      params: null,
      isExact: location.pathname === '/',
      pathname: '/'
    };
  } else {
    if (parent && pattern.charAt(0) !== '/') {
      pattern = parent.pathname + (parent.pathname.charAt(parent.pathname.length - 1) !== '/' ? '/' : '') + pattern;
    }

    var matcher = getMatcher(pattern, matchExactly);
    var match = matcher.regex.exec(location.pathname);

    if (match) {
      var params = parseParams(pattern, match, matcher.keys);
      var pathname = match[0];
      var isExact = pathname === location.pathname;

      return { params: params, isExact: isExact, pathname: pathname };
    } else {
      return null;
    }
  }
};

exports.default = matchPattern;