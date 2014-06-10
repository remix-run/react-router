var invariant = require('react/lib/invariant');
var merge = require('react/lib/merge');
var qs = require('querystring');

var paramMatcher = /:([a-z_$][a-z0-9_$]*)/ig;
var queryMatcher = /\?(.+)/;

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

var Path = {

  /**
   * Extracts the portions of the given URL path that match the given pattern
   * and returns an object of param name => value pairs. Returns null if the
   * pattern does not match the given path.
   */
  extractParams: function (pattern, path) {
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
  },

  /**
   * Returns an array of the names of all parameters in the given pattern.
   */
  extractParamNames: function (pattern) {
    var paramNames = pattern.match(paramMatcher);

    if (!paramNames)
      return [];

    return paramNames.map(function (paramName) {
      return paramName.substr(1);
    });
  },

  /**
   * Returns a version of the given route path with params interpolated. Throws
   * if there is a dynamic segment of the route path for which there is no param.
   */
  injectParams: function (pattern, params) {
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
  },

  /**
   * Returns an object that is the result of parsing any query string contained in
   * the given path, null if the path contains no query string.
   */
  extractQuery: function (path) {
    var match = path.match(queryMatcher);
    return match && qs.parse(match[1]);
  },

  /**
   * Returns a version of the given path without the query string.
   */
  withoutQuery: function (path) {
    return path.replace(queryMatcher, '');
  },

  /**
   * Returns a version of the given path with the parameters in the given query
   * added to the query string.
   */
  withQuery: function (path, query) {
    var existingQuery = Path.extractQuery(path);

    if (existingQuery)
      query = query ? merge(existingQuery, query) : existingQuery;

    var queryString = query && qs.stringify(query);

    if (queryString)
      return Path.withoutQuery(path) + '?' + queryString;

    return path;
  },

  /**
   * Returns a normalized version of the given path.
   */
  normalize: function (path) {
    return path.replace(/^\/*/, '/');
  }

};

module.exports = Path;
