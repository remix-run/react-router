import qs from 'qs';
import invariant from 'invariant';

export var parseQueryString = qs.parse;

export function stringifyQuery(query) {
  return qs.stringify(query, { arrayFormat: 'brackets' });
}

var queryMatcher = /\?([\s\S]*)$/;

export function getPathname(path) {
  return path.replace(queryMatcher, '');
}

export function getQueryString(path) {
  var match = path.match(queryMatcher);
  return match ? match[1] : '';
}

export function stripLeadingSlashes(path) {
  return path ? path.replace(/^\/+/, '') : '';
}

export function isAbsolutePath(path) {
  return typeof path === 'string' && path.charAt(0) === '/';
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeSource(string) {
  return escapeRegExp(string).replace(/\/+/g, '/+');
}

function _compilePattern(pattern) {
  var regexpSource = '';
  var paramNames = [];
  var tokens = [];

  var match, lastIndex = 0, matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|\*|\(|\)/g;
  while (match = matcher.exec(pattern)) {
    if (match.index !== lastIndex) {
      tokens.push(pattern.slice(lastIndex, match.index));
      regexpSource += escapeSource(pattern.slice(lastIndex, match.index));
    }

    if (match[1]) {
      regexpSource += '([^/?#]+)';
      paramNames.push(match[1]);
    } else if (match[0] === '*') {
      regexpSource += '([\\s\\S]*?)';
      paramNames.push('splat');
    } else if (match[0] === '(') {
      regexpSource += '(?:';
    } else if (match[0] === ')') {
      regexpSource += ')?';
    }

    tokens.push(match[0]);

    lastIndex = matcher.lastIndex;
  }

  if (lastIndex !== pattern.length) {
    tokens.push(pattern.slice(lastIndex, pattern.length));
    regexpSource += escapeSource(pattern.slice(lastIndex, pattern.length));
  }

  return {
    pattern,
    regexpSource,
    paramNames,
    tokens
  };
}

var CompiledPatternsCache = {};

export function compilePattern(pattern) {
  if (!(pattern in CompiledPatternsCache))
    CompiledPatternsCache[pattern] = _compilePattern(pattern);

  return CompiledPatternsCache[pattern];
}

/**
 * Attempts to match a pattern on the given pathname. Patterns may use
 * the following special characters:
 *
 * - :paramName     Matches a URL segment up to the next /, ?, or #. The
 *                  captured string is considered a "param"
 * - ()             Wraps a segment of the URL that is optional
 * - *              Consumes (non-greedy) all characters up to the next
 *                  character in the pattern, or to the end of the URL if
 *                  there is none
 *
 * The return value is an object with the following properties:
 *
 * - remainingPathname
 * - paramNames
 * - paramValues
 */
export function matchPattern(pattern, pathname) {
  var { regexpSource, paramNames, tokens } = compilePattern(stripLeadingSlashes(pattern));

  regexpSource += '/*'; // Ignore trailing slashes

  var captureRemaining = tokens[tokens.length - 1] !== '*';

  if (captureRemaining)
    regexpSource += '([\\s\\S]*?)';

  var match = pathname.match(new RegExp('^' + regexpSource + '$', 'i'));

  var remainingPathname, paramValues;
  if (match != null) {
    paramValues = Array.prototype.slice.call(match, 1);

    if (captureRemaining) {
      remainingPathname = paramValues.pop();
    } else {
      remainingPathname = pathname.replace(match[0], '');
    }
  } else {
    remainingPathname = paramValues = null;
  }

  return {
    remainingPathname,
    paramNames,
    paramValues
  };
}

export function getParamNames(pattern) {
  return compilePattern(pattern).paramNames;
}

export function getParams(pattern, pathname) {
  var { paramNames, paramValues } = matchPattern(pattern, stripLeadingSlashes(pathname));

  if (paramValues != null) {
    return paramNames.reduce(function (memo, paramName, index) {
      memo[paramName] = paramValues[index];
      return memo;
    }, {});
  }

  return null;
}

/**
 * Returns a version of the given pattern with params interpolated. Throws
 * if there is a dynamic segment of the pattern for which there is no param.
 */
export function formatPattern(pattern, params) {
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
