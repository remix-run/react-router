import invariant from 'invariant'
import { getRule } from './matchRules'

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeSource(string) {
  return escapeRegExp(string).replace(/\/+/g, '/+')
}

function _compilePattern(pattern) {
  let regexpSource = ''
  const paramNames = []
  const rules = []
  const tokens = []

  let match, lastIndex = 0
  let matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|<([a-zA-Z_$][a-zA-Z0-9_$]*):([a-zA-Z_$][a-zA-Z0-9_$]*)>|\*\*|\*|\(|\)/g
  while ((match = matcher.exec(pattern))) {
    if (match.index !== lastIndex) {
      tokens.push(pattern.slice(lastIndex, match.index))
      regexpSource += escapeSource(pattern.slice(lastIndex, match.index))
    }

    if(match[1] || match[2]) { // there is a parameter
      let ruleName, paramName
      if(match[3]) { // a rule is specified
        ruleName = match[2]
        paramName = match[3]
      } else { // no rule is specified
        ruleName = 'default'
        paramName = match[1] || match[2]
      }
      const rule = getRule(ruleName)
      regexpSource += rule.regex
      rules.push(rule)
      paramNames.push(paramName)
    } else if (match[0] === '**') {
      regexpSource += '([\\s\\S]*)'
      paramNames.push('splat')
    } else if (match[0] === '*') {
      regexpSource += '([\\s\\S]*?)'
      paramNames.push('splat')
      rules.push(getRule('path'))
    } else if (match[0] === '(') {
      regexpSource += '(?:'
    } else if (match[0] === ')') {
      regexpSource += ')?'
    }

    tokens.push(match[0])

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

export function compilePattern(pattern) {
  if (!(pattern in CompiledPatternsCache))
    CompiledPatternsCache[pattern] = _compilePattern(pattern)

  return CompiledPatternsCache[pattern]
}

function checkValidation(paramMatches, rules) {
  return paramMatches && paramMatches
    .every((v, i) => !rules[i] || rules[i].validate(v))
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
  let { regexpSource, paramNames, tokens, rules } = compilePattern(pattern)

  regexpSource += '/*' // Ignore trailing slashes

  const captureRemaining = tokens[tokens.length - 1] !== '*'

  if (captureRemaining)
    regexpSource += '([\\s\\S]*?)'

  const match = pathname.match(new RegExp('^' + regexpSource + '$', 'i'))
  const paramMatches = Array.prototype.slice.call(match || [], 1)
  const validationPasses = checkValidation(paramMatches, rules)

  let remainingPathname = null, paramValues = null
  if (match != null && validationPasses) {
    paramValues = paramMatches
      .map((v) => v != null ? decodeURIComponent(v.replace(/\+/g, '%20')) : v)
      .map((v, i) => rules[i] ? rules[i].convert(v) : v)
    if (captureRemaining) {
      remainingPathname = paramValues.pop()
    } else {
      remainingPathname = pathname.replace(match[0], '')
    }
  }

  return {
    remainingPathname,
    paramNames,
    paramValues
  }
}

export function getParamNames(pattern) {
  return compilePattern(pattern).paramNames
}

export function getParams(pattern, pathname) {
  const { paramNames, paramValues } = matchPattern(pattern, pathname)

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
export function formatPattern(pattern, params) {
  params = params || {}

  const { tokens } = compilePattern(pattern)
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
        pathname += encodeURI(paramValue).replace(/%20/g, '+')
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
        pathname += encodeURIComponent(paramValue).replace(/%20/g, '+')
    } else {
      pathname += token
    }
  }

  return pathname.replace(/\/+/g, '/')
}
