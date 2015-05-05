var { getPathname, compilePattern, stripLeadingSlashes } = require('./PathUtils');
var { loopAsync } = require('./AsyncUtils');

function getChildRoutes(route, callback) {
  if (route.childRoutes) {
    callback(null, route.childRoutes);
  } else if (route.getChildRoutes) {
    route.getChildRoutes(callback);
  } else {
    callback();
  }
}

function assignParams(params, paramNames, paramValues) {
  return paramNames.reduceRight(function (params, paramName, index) {
    var paramValue = paramValues[index];

    if (Array.isArray(params[paramName])) {
      params[paramName].unshift(paramValue);
    } else if (paramName in params) {
      params[paramName] = [ paramValue, params[paramName] ];
    } else {
      params[paramName] = paramValue;
    }

    return params;
  }, params);
}

function createParams(paramNames, paramValues) {
  return assignParams({}, paramNames, paramValues);
}

function matchPattern(pattern, pathname) {
  var { escapedSource, paramNames, tokens } = compilePattern(stripLeadingSlashes(pattern));

  escapedSource += '/*'; // Ignore trailing slashes

  var captureRemaining = tokens[tokens.length - 1] !== '*';

  if (captureRemaining)
    escapedSource += '(.*?)';

  var match = pathname.match(new RegExp('^' + escapedSource + '$', 'i'));

  var remainingPathname, paramValues;
  if (match != null) {
    paramValues = Array.prototype.slice.call(match, 1);

    if (captureRemaining) {
      remainingPathname = paramValues.pop();
    } else {
      remainingPathname = pathname.replace(match[0], '');
    }
  }

  return {
    remainingPathname,
    paramNames,
    paramValues
  };
}

function matchRouteDeep(route, pathname, callback) {
  var { remainingPathname, paramNames, paramValues } = matchPattern(route.path, pathname);

  if (remainingPathname === '') {
    // This route matched the whole path!
    callback(null, {
      params: createParams(paramNames, paramValues),
      branch: [ route ]
    });
  } else if (remainingPathname != null) {
    // This route matched at least some of the path.
    getChildRoutes(route, function (error, childRoutes) {
      if (error) {
        callback(error);
      } else if (childRoutes) {
        // Check the child routes to see if any of them match.
        matchRoutes(childRoutes, remainingPathname, function (error, match) {
          if (error) {
            callback(error);
          } else if (match) {
            // A child route matched! Augment the match and pass it up the stack.
            assignParams(match.params, paramNames, paramValues);
            match.branch.unshift(route);
            callback(null, match);
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

function matchRoutes(routes, pathname, callback) {
  loopAsync(routes.length, function (index, next, done) {
    matchRouteDeep(routes[index], pathname, function (error, match) {
      if (error || match) {
        done(error, match);
      } else {
        next();
      }
    });
  }, callback);
}

/**
 * Searches the given tree of routes for a branch that matches
 * the given path and calls callback(error, match) with the
 * result. The match object has the following properties:
 *
 * routes   An array of route objects that matched, in nested order
 * params   An object of URL params (contained in the pathname)
 *
 * If no match can be made the callback argument is undefined.
 */
function findMatch(routes, path, callback) {
  if (!Array.isArray(routes))
    routes = [ routes ]; // Allow a single route

  var pathname = stripLeadingSlashes(getPathname(path));

  matchRoutes(routes, pathname, callback);
}

module.exports = findMatch;
