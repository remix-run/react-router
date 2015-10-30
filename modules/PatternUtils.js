import invariant from 'invariant'
import { getRule } from './matchRules'

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeSource(string) {
  return escapeRegExp(string).replace(/\/+/g, '/+')
}

/**
 * match a rule enclosed by '<...>'
 */
function _compileRule(pattern) {
  let ruleMatcher =
    /^(?:([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\(([^)]*)\))?:)?([a-zA-Z_$][a-zA-Z0-9_$]*)$/g

  let [ , ruleName, ruleArgs, paramName ] = ruleMatcher.exec(pattern) || []

  try {
    if(ruleArgs) ruleArgs = eval(`(${ruleArgs})`)
  }
  catch(e) {
    invariant(false, '%s is not a valid argument for rule %s',
      ruleArgs, ruleName)
  }
  const rule = getRule(ruleName)

  invariant(paramName,
    'invalid rule "%s". The rule must have a parameter name', pattern)

  return {
    rule,
    ruleArgs,
    paramName
  }
}

function _compilePattern(pattern) {
  let regexpSource = ''
  const tokens = []
  const params = []

  let match, lastIndex = 0
  let matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|<([^>]+)>|\*\*|\*|\(|\)/g
  while ((match = matcher.exec(pattern))) {
    if (match.index !== lastIndex) {
      tokens.push(pattern.slice(lastIndex, match.index))
      regexpSource += escapeSource(pattern.slice(lastIndex, match.index))
    }

    let param
    const [ token, simpleArg, ruleArg ] = match

    if(simpleArg) {
      param = {
        paramName: simpleArg,
        rule: getRule('default')
      }
    } else if(ruleArg) {
      param = _compileRule(ruleArg)
    } else if (token === '**') {
      param = {
        rule: getRule('greedySplat'),
        paramName: 'splat'
      }
    } else if (token === '*') {
      param = {
        rule: getRule('splat'),
        paramName: 'splat'
      }
    } else if (token === '(') {
      regexpSource += '(?:'
    } else if (token === ')') {
      regexpSource += ')?'
    }

    if(param) {
      params.push(param)
      regexpSource += param.rule.regex
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
    tokens,
    params
  }
}

const CompiledPatternsCache = {}

export function compilePattern(pattern) {
  if (!(pattern in CompiledPatternsCache))
    CompiledPatternsCache[pattern] = _compilePattern(pattern)

  return CompiledPatternsCache[pattern]
}

function checkValidation(paramMatches, params) {
  return paramMatches.every((v, i) => {
    let { rule, ruleArgs } = params[i] || {}
    return !rule || rule.validate(v, ruleArgs)
  })
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

  let { regexpSource, tokens, params } = compilePattern(pattern)

  regexpSource += '/*' // Ignore trailing slashes

  const captureRemaining = tokens[tokens.length - 1] !== '*'

  if (captureRemaining)
    regexpSource += '([\\s\\S]*?)'

  const match = pathname.match(new RegExp('^' + regexpSource + '$', 'i'))
  const paramMatches = Array.prototype.slice.call(match || [], 1)
  const validationPasses = checkValidation(paramMatches, params)

  let remainingPathname = null, paramValues = null
  if (match != null && validationPasses) {
    paramValues = paramMatches
      .map((v) => v != null ? decodeURIComponent(v.replace(/\+/g, '%20')) : v)
      .map((v, i) => {
        let { rule, ruleArgs } = params[i] || {}
        return rule ? rule.convert(v, ruleArgs) : v
      })
    if (captureRemaining) {
      remainingPathname = paramValues.pop()
    } else {
      remainingPathname = pathname.replace(match[0], '')
    }
  }

  return {
    remainingPathname,
    paramNames: params.map(p => p.paramName),
    paramValues
  }
}

export function getParamNames(pattern) {
  return compilePattern(pattern).params
    .map(p => p.paramName)
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
