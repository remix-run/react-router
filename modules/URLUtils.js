import qs from 'qs';

export var parseQueryString = qs.parse;

export function stringifyQuery(query) {
  return qs.stringify(query, { arrayFormat: 'brackets' });
}

export function stripLeadingSlashes(path) {
  return path ? path.replace(/^\/+/, '') : '';
}

export function isAbsolutePath(path) {
  return typeof path === 'string' && path.charAt(0) === '/';
}

export function queryContains(query, props) {
  if (props == null)
    return true;

  if (query == null)
    return false;

  for (var p in props)
    if (props.hasOwnProperty(p) && String(query[p]) !== String(props[p]))
      return false;

  return true;
}

var queryMatcher = /\?(.*)$/;

export function getPathname(path) {
  return path.replace(queryMatcher, '');
}

export function getQueryString(path) {
  var match = path.match(queryMatcher);
  return match ? match[1] : '';
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
      regexpSource += '(.*?)';
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
    regexpSource += '(.*?)';

  var match = pathname.match(new RegExp('^' + regexpSource + '$', 'i'));

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

export function getParamNames(pattern) {
  return compilePattern(pattern).paramNames;
}
