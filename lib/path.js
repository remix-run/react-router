var invariant = require('react/lib/invariant');
var merge = require('react/lib/merge');

var paramMatcher = /:([a-z_$][a-z0-9_$]*)/ig;

var _compiledPatterns = {};

function compilePattern(pattern) {
  if (_compiledPatterns[pattern])
    return _compiledPatterns[pattern];

  var compiled = _compiledPatterns[pattern] = {};
  var paramNames = compiled.paramNames = [];

  var matcherSource = pattern.replace(paramMatcher, function (match, paramName) {
    paramNames.push(paramName);
    return '([^./?#]+)';
  });

  compiled.matcher = new RegExp('^' + matcherSource + '$', 'i');

  return compiled;
}

function isDynamicPattern(pattern) {
  return pattern.indexOf(':') !== -1;
}

/**
 * Extracts the portions of the given URL path that match the given pattern
 * and returns an object of param name => value pairs. Returns null if the
 * pattern does not match the given path.
 */
exports.extractParams = extractParams;
function extractParams(pattern, path) {
  if (!isDynamicPattern(pattern)) {
    if (pattern === decodeURIComponent(path))
      return {}; // No dynamic segments, but the paths match.

    return null;
  }

  var compiled = compilePattern(pattern);
  var match = decodeURIComponent(path).match(compiled.matcher);

  if (!match)
    return null;

  var params = {};

  compiled.paramNames.forEach(function (paramName, index) {
    params[paramName] = match[index + 1];
  });

  return params;
}

/**
 * Returns an array of the names of all parameters in the given pattern.
 */
exports.extractParamNames = extractParamNames;
function extractParamNames(pattern) {
  var paramNames = pattern.match(paramMatcher);

  if (!paramNames)
    return [];

  return paramNames.map(function (paramName) {
    return paramName.substr(1);
  });
}

/**
 * Returns a version of the given route path with params interpolated. Throws
 * if there is a dynamic segment of the route path for which there is no param.
 */
exports.injectParams = injectParams;
function injectParams(pattern, params) {
  if (!isDynamicPattern(pattern))
    return pattern;

  params = params || {};

  return pattern.replace(paramMatcher, function (match, paramName) {
    invariant(
      params[paramName],
      'Missing "' + paramName + '" parameter for path "' + pattern + '"'
    );

    return encodeURIComponent(params[paramName]);
  });
}

var qs = require('querystring');
var queryMatcher = /\?(.+)/;

/**
 * Returns an object that is the result of parsing any query string contained in
 * the given path, null if the path contains no query string.
 */
exports.extractQuery = extractQuery;
function extractQuery(path) {
  var match = path.match(queryMatcher);
  return match && qs.parse(match[1]);
}

/**
 * Returns a version of the given path without the query string.
 */
exports.withoutQuery = withoutQuery;
function withoutQuery(path) {
  return path.replace(queryMatcher, '');
}

/**
 * Returns a version of the given path with the parameters in the given query
 * added to the query string.
 */
exports.withQuery = withQuery;
function withQuery(path, query) {
  var existingQuery = extractQuery(path);

  if (existingQuery)
    query = query ? merge(existingQuery, query) : existingQuery;

  var queryString = query && qs.stringify(query);

  if (queryString)
    return withoutQuery(path) + '?' + queryString;

  return path;
}

/**
 * Returns a normalized version of the given path.
 */
exports.normalize = normalize;
function normalize(path) {
  return path.replace(/^\/+/, '');
}

