/*eslint no-empty: 0*/
import warning from './warning'

let useMembrane = false

if (__DEV__) {
  try {
    if (Object.defineProperty({}, 'x', { get() { return true } }).x) {
      useMembrane = true
    }
  } catch(e) { }
}

// wraps an object in a membrane to warn about deprecated property access
export default function deprecateObjectProperties(object, message) {
  if (!useMembrane)
    return object

  const membrane = {}

  for (let prop in object) {
    if (typeof object[prop] === 'function') {
      membrane[prop] = function () {
        warning(false, message)
        return object[prop].apply(object, arguments)
      }
    } else {
      Object.defineProperty(membrane, prop, {
        configurable: false,
        enumerable: false,
        get() {
          warning(false, message)
          return object[prop]
        }
      })
    }
  }

  return membrane
}

