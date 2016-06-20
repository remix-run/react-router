import warning from './routerWarning'
import { canUseMembrane } from './deprecateObjectProperties'

// No-op by default.
let deprecateLocationProperties = () => {}

if (__DEV__ && canUseMembrane) {
  deprecateLocationProperties = (nextState, location) => {
    const nextStateWithLocation = { ...nextState }

    // I don't use deprecateObjectProperties here because I want to keep the
    // same code path between development and production, in that we just
    // assign extra properties to the copy of the state object in both cases.
    for (const prop in location) {
      if (!Object.prototype.hasOwnProperty.call(location, prop)) {
        continue
      }

      Object.defineProperty(nextStateWithLocation, prop, {
        get() {
          warning(false, 'Accessing location properties from the first argument to `getComponent` and `getComponents` is deprecated. That argument is now the router state (`nextState`) rather than the location. To access the location, use `nextState.location`.')
          return location[prop]
        }
      })
    }

    return nextStateWithLocation
  }
}

export default deprecateLocationProperties
