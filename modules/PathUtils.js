/* jshint -W084 */
var invariant = require('react/lib/invariant');
var assign = require('object-assign');
var qs = require('qs');

var queryMatcher = /\?(.*)$/;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeSource(string) {
  return escapeRegExp(string).replace(/\/+/g, '/+');
}

function _compilePattern(pattern) {
  var escapedSource = '';
  var paramNames = [];
  var tokens = [];

  var match, lastIndex = 0, matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|\*|\(|\)/g;
  while (match = matcher.exec(pattern)) {
    if (match.index !== lastIndex) {
      tokens.push(pattern.slice(lastIndex, match.index));
      escapedSource += escapeSource(pattern.slice(lastIndex, match.index));
    }

    if (match[1]) {
      escapedSource += '([^/?#]+)';
      paramNames.push(match[1]);
    } else if (match[0] === '*') {
      escapedSource += '(.*?)';
      paramNames.push('splat');
    } else if (match[0] === '(') {
      escapedSource += '(?:';
    } else if (match[0] === ')') {
      escapedSource += ')?';
    }

    tokens.push(match[0]);

    lastIndex = matcher.lastIndex;
  }

  if (lastIndex !== pattern.length) {
    tokens.push(pattern.slice(lastIndex, pattern.length));
    escapedSource += escapeSource(pattern.slice(lastIndex, pattern.length));
  }

  return {
    pattern,
    escapedSource,
    paramNames,
    tokens
  };
}

var _compiledPatterns = {};

function compilePattern(pattern) {
  if (!(pattern in _compiledPatterns))
    _compiledPatterns[pattern] = _compilePattern(pattern);

  return _compiledPatterns[pattern];
}

function stripLeadingSlashes(path) {
  return path ? path.replace(/^\/+/, '') : '';
}

function stripTrailingSlashes(path) {
  return path.replace(/\/+$/, '');
}

function isAbsolutePath(path) {
  return typeof path === 'string' && path.charAt(0) === '/';
}

function getPathname(path) {
  return path.replace(queryMatcher, '');
}

function getQueryString(path) {
  var match = path.match(queryMatcher);
  return match ? match[1] : '';
}

function getQuery(path, options) {
  return qs.parse(getQueryString(path), options);
}

function withQuery(path, query) {
  if (typeof query !== 'string')
    query = qs.stringify(query, { arrayFormat: 'brackets' });

  if (query)
    return getPathname(path) + '?' + query;

  return getPathname(path);
}

/**
 * Returns a version of the given route path with params
 * interpolated. Throws if there is a dynamic segment of
 * the route path for which there is no param.
 */
function injectParams(pattern, params) {
  params = params || {};

  var { tokens } = compilePattern(pattern);
  var parenCount = 0, pathname = '', splatIndex = 0;

  var token, paramName, paramValue;
  for (var i = 0, len = tokens.length; i < len; ++i) {
    token = tokens[i];

    if (token === '*') {
      paramValue = Array.isArray(params.splat) ? params.splat[splatIndex++] : params.splat;

      invariant(
        paramValue != null || parenCount > 0,
        'Missing splat #%s for path "%s"',
        splatIndex, pattern
      );

      if (paramValue != null)
        pathname += paramValue;
    } else if (token === '(') {
      parenCount += 1;
    } else if (token === ')') {
      parenCount -= 1;
    } else if (token.charAt(0) === ':') {
      paramName = token.substring(1);
      paramValue = params[paramName];

      invariant(
        paramValue != null || parenCount > 0,
        'Missing "%s" parameter for path "%s"',
        paramName, pattern
      );

      if (paramValue != null)
        pathname += paramValue;
    } else {
      pathname += token;
    }
  }

  return pathname.replace(/\/+/g, '/');
}

module.exports = {
  compilePattern,
  stripLeadingSlashes,
  stripTrailingSlashes,
  isAbsolutePath,
  getPathname,
  getQueryString,
  getQuery,
  withQuery,
  injectParams
};
