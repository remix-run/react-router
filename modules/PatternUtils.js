import invariant from 'invariant'
import { splat, greedySplat, string } from './rules'

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeSource(string) {
  return escapeRegExp(string).replace(/\/+/g, '/+')
}

function _compilePattern(pattern, paramRules = {}) {
  let regexpSource = ''
  const paramNames = []
  const tokens = []
  const rules = []

  let match, lastIndex = 0, matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|\*\*|\*|\(|\)/g
  while ((match = matcher.exec(pattern))) {
    let [ token, param ] = match
    if (match.index !== lastIndex) {
      tokens.push(pattern.slice(lastIndex, match.index))
      regexpSource += escapeSource(pattern.slice(lastIndex, match.index))
    }

    let rule
    if (param) {
      rule = paramRules[param] || string()
    } else if (token === '**') {
      rule = greedySplat()
      param = 'splat'
    } else if (token === '*') {
      rule = splat()
      param = 'splat'
    } else if (token === '(') {
      regexpSource += '(?:'
    } else if (token === ')') {
      regexpSource += ')?'
    }

    if(rule) {
      rules.push(rule)
      paramNames.push(param)
      regexpSource += rule.regex
    }

    tokens.push(token)

    lastIndex = matcher.lastIndex
  }

  if (lastIndex !== pattern.length) {
    tokens.push(pattern.slice(lastIndex, pattern.length))
    regexpSource += escapeSource(pattern.slice(lastIndex, pattern.length))
  }

  return {
    pattern,
    regexpSource,
    paramNames,
    tokens,
    rules
  }
}

const CompiledPatternsCache = {}

export function compilePattern(pattern, paramRules) {
  if (!(pattern in CompiledPatternsCache))
    CompiledPatternsCache[pattern] = _compilePattern(pattern, paramRules)

  return CompiledPatternsCache[pattern]
}

/**
 * Attempts to match a pattern on the given pathname. Patterns may use
 * the following special characters:
 *
 * - :paramName     Matches a URL segment and captures a param. The matched
 *                  segment depends on the parameter rule. If no rule is
 *                  provided, it defaults to the string matcher ([^/?#]+)
 * - ()             Wraps a segment of the URL that is optional
 * - *              Consumes (non-greedy) all characters up to the next
 *                  character in the pattern, or to the end of the URL if
 *                  there is none
 * - **             Consumes (greedy) all characters up to the next character
 *                  in the pattern, or to the end of the URL if there is none
 *
 * The return value is an object with the following properties:
 *
 * - remainingPathname
 * - paramNames
 * - paramValues
 */
export function matchPattern(pattern, pathname, paramRules = {}) {
  // Make leading slashes consistent between pattern and pathname.
  if (pattern.charAt(0) !== '/') {
    pattern = `/${pattern}`
  }
  if (pathname.charAt(0) !== '/') {
    pathname = `/${pathname}`
  }

  let { regexpSource, paramNames, tokens, rules }
    = compilePattern(pattern, paramRules)

  regexpSource += '/*' // Ignore trailing slashes

  // Special-case patterns like '*' for catch-all routes.
  const captureRemaining = tokens[tokens.length - 1] !== '*'

  if (captureRemaining) {
    // This will match newlines in the remaining path.
    regexpSource += '([\\s\\S]*?)'
  }

  const match = pathname.match(new RegExp('^' + regexpSource + '$', 'i'))

  let remainingPathname = null, paramValues = null
  if (match != null) {
    let matchedPath
    if (captureRemaining) {
      remainingPathname = match.pop()
      matchedPath =
        match[0].substr(0, match[0].length - remainingPathname.length)
    } else {
      // If this matched at all, then the match was the entire pathname.
      matchedPath = match[0]
      remainingPathname = ''
    }

    // Ensure we actually match at a path boundary.
    if (remainingPathname && remainingPathname.charAt(0) !== '/') {
      // This depends on the leading slash getting added to pathname above to
      // work in all cases.
      if (!matchedPath || matchedPath.charAt(matchedPath.length - 1) !== '/') {
        return {}
      }
    }

    paramValues = match.slice(1).map(
      v => v != null ? decodeURIComponent(v) : v
    )

    // check the rules
    if(!paramValues.every((v, i) => rules[i].validate(v))) {
      return {}
    }

    // convert the parameters
    paramValues = paramValues.map((v, i) => rules[i].convert(v))
  } else {
    paramNames = null
  }

  return {
    remainingPathname,
    paramNames,
    paramValues
  }
}

export function getParamNames(pattern, paramRules) {
  return compilePattern(pattern, paramRules).paramNames
}

export function getParams(pattern, pathname, paramRules) {
  const { paramNames, paramValues } = matchPattern(pattern, pathname, paramRules)

  if (paramValues != null) {
    return paramNames.reduce(function (memo, paramName, index) {
      memo[paramName] = paramValues[index]
      return memo
    }, {})
  }

  return null
}

/**
 * Returns a version of the given pattern with params interpolated. Throws
 * if there is a dynamic segment of the pattern for which there is no param.
 */
export function formatPattern(pattern, params, paramRules) {
  params = params || {}

  const { tokens } = compilePattern(pattern, paramRules)
  let parenCount = 0, pathname = '', splatIndex = 0

  let token, paramName, paramValue
  for (let i = 0, len = tokens.length; i < len; ++i) {
    token = tokens[i]

    if (token === '*' || token === '**') {
      paramValue = Array.isArray(params.splat) ? params.splat[splatIndex++] : params.splat

      invariant(
        paramValue != null || parenCount > 0,
        'Missing splat #%s for path "%s"',
        splatIndex, pattern
      )

      if (paramValue != null)
        pathname += encodeURI(paramValue)
    } else if (token === '(') {
      parenCount += 1
    } else if (token === ')') {
      parenCount -= 1
    } else if (token.charAt(0) === ':') {
      paramName = token.substring(1)
      paramValue = params[paramName]

      invariant(
        paramValue != null || parenCount > 0,
        'Missing "%s" parameter for path "%s"',
        paramName, pattern
      )

      if (paramValue != null)
        pathname += encodeURIComponent(paramValue)
    } else {
      pathname += token
    }
  }

  return pathname.replace(/\/+/g, '/')
}
