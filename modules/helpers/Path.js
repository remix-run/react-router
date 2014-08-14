var invariant = require('react/lib/invariant');
var copyProperties = require('react/lib/copyProperties');
var qs = require('querystring');
var URL = require('./URL');

var paramMatcher = /((?::[a-z_$][a-z0-9_$]*)|\*)/ig;
var queryMatcher = /\?(.+)/;

function getParamName(pathSegment) {
  return pathSegment === '*' ? 'splat' : pathSegment.substr(1);
}

var _compiledPatterns = {};

function compilePattern(pattern) {
  if (_compiledPatterns[pattern])
    return _compiledPatterns[pattern];

  var compiled = _compiledPatterns[pattern] = {};
  var paramNames = compiled.paramNames = [];

  var source = pattern.replace(paramMatcher, function (match, pathSegment) {
    paramNames.push(getParamName(pathSegment));
    return pathSegment === '*' ? '(.*?)' : '([^/?#]+)';
  });

  compiled.matcher = new RegExp('^' + source + '$', 'i');

  return compiled;
}

function isDynamicPattern(pattern) {
  return pattern.indexOf(':') !== -1 || pattern.indexOf('*') !== -1;
}

var Path = {

  /**
   * Extracts the portions of the given URL path that match the given pattern
   * and returns an object of param name => value pairs. Returns null if the
   * pattern does not match the given path.
   */
  extractParams: function (pattern, path) {
    if (!pattern)
      return null;

    if (!isDynamicPattern(pattern)) {
      if (pattern === URL.decode(path))
        return {}; // No dynamic segments, but the paths match.

      return null;
    }

    var compiled = compilePattern(pattern);
    var match = URL.decode(path).match(compiled.matcher);

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
    if (!pattern)
      return [];
    return compilePattern(pattern).paramNames;
  },

  /**
   * Returns a version of the given route path with params interpolated. Throws
   * if there is a dynamic segment of the route path for which there is no param.
   */
  injectParams: function (pattern, params) {
    if (!pattern)
      return null;

    if (!isDynamicPattern(pattern))
      return pattern;

    params = params || {};

    return pattern.replace(paramMatcher, function (match, pathSegment) {
      var paramName = getParamName(pathSegment);

      invariant(
        params[paramName] != null,
        'Missing "' + paramName + '" parameter for path "' + pattern + '"'
      );

      // Preserve forward slashes.
      return String(params[paramName]).split('/').map(URL.encode).join('/');
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
      query = query ? copyProperties(existingQuery, query) : existingQuery;

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
