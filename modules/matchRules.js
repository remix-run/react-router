import invariant from 'invariant'
import warning from 'warning'

export class RuleBase {
  regex = '([^/?#]+)'

  validate() {
    return true
  }

  convert(val) {
    return val
  }
}

/**
 * This rule matches any character except the forward slashes.
 * This is the default rule when nothing else is specified.
 *
 * @param length specifies the precise length of the argument
 * @param minLength specifies the minimum length for the argument
 * @param maxLength specifies the maximum length for the argument
 */
class StringRule extends RuleBase {

  validate(val, { maxLength, minLength, length } = {}) {
    if(maxLength && val.length > maxLength) return false
    if(minLength && val.length < minLength) return false
    if(length && val.length !== length) return false
    return true
  }

}

/**
 * This rule matches anything, included forward slashes
 *
 * '/<path:page>/edit' will match '/a/b/c/edit'
 */
class PathRule extends RuleBase {
  regex = '([^?#]+)'
}

/**
 * rule for the greedy spat matcher
 */
class GreedySplatRule extends RuleBase {
  regex = '([\\s\\S]*)'
}

/**
 * rule for the spat matcher
 */
class SplatRule extends RuleBase {
  regex = '([\\s\\S]*?)'
}

/**
 * This rule matches non negative integers.
 * The following parameters can be specified:
 *
 * @param fixedLength specifies the precise length of the argument
 * @param max specifies the minimum value assignable
 * @param min specifies the maximum value assignable
 *
 * 'users/<int:id>' will match 'users/98123'
 */
class IntRule extends RuleBase {
  regex = '(\\d+)'

  validate(val, { max, min, fixedLength } = {}) {
    const num = Number(val)
    if(fixedLength && fixedLength !== val.length) return false
    if(max && num > max) return false
    if(min && num < min) return false
    return true
  }

  convert(val) {
    return Number(val)
  }
}

/**
 * This rule mathces only if the value is specified in the values array
 *
 * 'pizza/<any(small,medium,big):size>' will match 'pizza/small'
 */
class AnyRule extends RuleBase {
  validate(val, values) {
    return (!values || values.indexOf(val) !== -1)
  }
}

/**
 * This rule matches only UUIDs.
 *
 * '/users/<uuid:userId>' will match '/users/d3829a0d-3b0a-4cf4-9b0b-f6cb309d977c'
 */
class UuidRule extends RuleBase {
  regex = '([A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}\
    -[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12})'
}

const matchRules = {
  int: new IntRule(),
  string: new StringRule(),
  path: new PathRule(),
  any: new AnyRule(),
  uuid: new UuidRule(),
  default: new StringRule(),
  greedySplat: new GreedySplatRule(),
  splat: new SplatRule()
}

/**
 * Add a rule to the set of URL matching rules
 * @param name the name of the rule
 * @param rule the rule function. The rule should take one string parameter
 *   and should return true or false if the validation passes or not
 */
export function matchRule(name, rule) {
  if(matchRules[name]) {
    warning(false, 'Trying to add URL matching rule \'%s\' twice', name)
    return
  }
  invariant(rule && rule.convert && rule.regex && rule.validate,
    'Rule %s is not a valid rule. Try to inherit from RuleBase', name)
  matchRules[name] = rule
}

/**
 * Get the rule with the specified name
 */
export function getRule(name) {
  const rule = matchRules[name]
  warning(rule, 'rule %s is not defined', name)
  return rule
}
