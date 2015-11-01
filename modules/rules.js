/**
 * This rule matches any character except the forward slashes.
 * This is the default rule when nothing else is specified.
 *
 * @param length specifies the precise length of the argument
 * @param minLength specifies the minimum length for the argument
 * @param maxLength specifies the maximum length for the argument
 */
export function string({ maxLength, minLength, length } = {}) {
  return createRule({
    validate: (val) => {
      if(maxLength && val.length > maxLength) return false
      if(minLength && val.length < minLength) return false
      if(length && val.length !== length) return false
      return true
    }
  })
}

/**
 * rule for the greedy spat matcher
 */
export function greedySplat() {
  return createRule({
    regex: '([\\s\\S]*)'
  })
}

/**
 * rule for the spat matcher
 */
export function splat() {
  return createRule({
    regex: '([\\s\\S]*?)'
  })
}

/**
 * This rule mathces only if the value is specified in the values array
 */
export function any(...values) {
  return createRule({
    validate: (val) => values.indexOf(val) !== -1
  })
}

/**
 * This rule matches non negative integers.
 * The following parameters can be specified:
 *
 * @param fixedLength specifies the precise length of the argument
 * @param max specifies the minimum value assignable
 * @param min specifies the maximum value assignable
 */
export function int({ max, min, fixedLength } = {}) {
  return createRule({
    regex: '(\\d+)',

    validate: function (val) {
      const num = Number(val)
      if(fixedLength && fixedLength !== val.length) return false
      if(max && num > max) return false
      if(min && num < min) return false
      return true
    },

    convert: function (val) {
      return Number(val)
    }
  })
}

/**
 * This rule matches only valid UUIDs.
 */
export function uuid() {
  return createRule({
    regex: '([A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12})'
  })
}

/**
 * Utility functions to create custom URL rules
 */
export function createRule({ regex, validate, convert }) {
  return {
    regex: regex || '([^/?#]+)',
    validate: validate || (() => true),
    convert: convert || ((val) => val)
  }
}
