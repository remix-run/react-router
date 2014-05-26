/**
 * A regular expression used to match parameter names in URL paths.
 */
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
    if (!params[paramName])
      throw new Error('Missing "' + paramName + '" parameter in path ' + routePath);

    return params[paramName];
  });
}

