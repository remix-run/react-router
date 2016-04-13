import warning from './routerWarning'

export let canUseMembrane = false

// No-op by default.
let deprecateObjectProperties = object => object

if (__DEV__) {
  try {
    if (Object.defineProperty({}, 'x', { get() { return true } }).x) {
      canUseMembrane = true
    }
  /* eslint-disable no-empty */
  } catch(e) {}
  /* eslint-enable no-empty */

  if (canUseMembrane) {
    deprecateObjectProperties = (object, message) => {
      // Wrap the deprecated object in a membrane to warn on property access.
      const membrane = {}

      for (const prop in object) {
        if (!Object.prototype.hasOwnProperty.call(object, prop)) {
          continue
        }

        if (typeof object[prop] === 'function') {
          // Can't use fat arrow here because of use of arguments below.
          membrane[prop] = function () {
            warning(false, message)
            return object[prop].apply(object, arguments)
          }
          continue
        }

        // These properties are non-enumerable to prevent React dev tools from
        // seeing them and causing spurious warnings when accessing them. In
        // principle this could be done with a proxy, but support for the
        // ownKeys trap on proxies is not universal, even among browsers that
        // otherwise support proxies.
        Object.defineProperty(membrane, prop, {
          get() {
            warning(false, message)
            return object[prop]
          }
        })
      }

      return membrane
    }
  }
}

export default deprecateObjectProperties
