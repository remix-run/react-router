/*eslint no-empty: 0*/
import warning from 'warning'

let useMembrane = false

if (__DEV__) {
  try {
    Object.defineProperty({}, 'x', { get() { return true } }).x
    useMembrane = true
  } catch(e) { }
}

// wraps an object in a membrane to warn about deprecated property access
export default function deprecateObjectProperties(object, deprecatedKeys) {
  if (!useMembrane)
    return object

  const membrane = {}

  for (let prop in object) {
    Object.defineProperty(membrane, prop, {
      configurable: false,
      enumerable: true,
      get() {
        if (deprecatedKeys[prop])
          warning(!deprecatedKeys[prop], deprecatedKeys[prop])
        return object[prop]
      }
    })
  }

  return membrane
}

