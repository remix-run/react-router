var invariant = require('react/lib/invariant');
var merge = require('react/lib/merge');

var paramMatcher = /:([a-z_$][a-z0-9_$]*)/ig;

/**
 * A cache for compiled route paths, since we repeatedly see the same ones.
 */
var _compiledRoutePaths = {};

function compileRoutePath(routePath) {
  if (_compiledRoutePaths[routePath])
    return _compiledRoutePaths[routePath];

  var compiled = _compiledRoutePaths[routePath] = {};
  var paramNames = compiled.paramNames = [];

  var pattern = routePath.replace(paramMatcher, function (match, paramName) {
    paramNames.push(paramName);
    return '([^./?#]+)';
  });

  compiled.matcher = new RegExp('^' + pattern + '$', 'i');

  return compiled;
}

function isDynamicPath(path) {
  return path.indexOf(':') !== -1;
}

/**
 * Extracts the portions of the given URL path that match the route's path
 * and returns an object of param name => value pairs. Returns null if the
 * route's path does not match the given path.
 */
exports.extractParams = extractParams;
function extractParams(routePath, path) {
  if (!isDynamicPath(routePath)) {
    if (routePath === path)
      return {}; // No dynamic segments, but the paths match.

    return null;
  }

  var compiled = compileRoutePath(routePath);
  var match = path.match(compiled.matcher);

  if (match) {
    var params = {};

    compiled.paramNames.forEach(function (paramName, index) {
      params[paramName] = match[index + 1];
    });

    return params;
  }

  return null;
}

/**
 * Returns a version of the given route path with params interpolated. Throws
 * if there is a dynamic segment of the route path for which there is no param.
 */
exports.injectParams = injectParams;
function injectParams(routePath, params) {
  if (!isDynamicPath(routePath))
    return routePath;

  return routePath.replace(paramMatcher, function (match, paramName) {
    invariant(
      params[paramName],
      'Missing "' + paramName + '" parameter for path "' + routePath + '"'
    );

    return params[paramName];
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
 * Returns a string that represents the portion of the URL path that is matched
 * by the given <Route>.
 */
exports.forRoute = forRoute;
function forRoute(route) {
  return normalize(route.props.path || route.props.name || '');
}

/**
 * Returns a normalized version of the given path.
 */
exports.normalize = normalize;
function normalize(path) {
  return path.replace(/^\/+/, '');
}

