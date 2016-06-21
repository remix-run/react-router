import { canUseMembrane } from './deprecateObjectProperties'
import warning from './routerWarning'

export default function makeStateWithLocation(state, location) {
  if (__DEV__ && canUseMembrane) {
    const stateWithLocation = { ...state }

    // I don't use deprecateObjectProperties here because I want to keep the
    // same code path between development and production, in that we just
    // assign extra properties to the copy of the state object in both cases.
    for (const prop in location) {
      if (!Object.prototype.hasOwnProperty.call(location, prop)) {
        continue
      }

      Object.defineProperty(stateWithLocation, prop, {
        get() {
          warning(false, 'Accessing location properties directly from the first argument to `getComponent`, `getComponents`, `getChildRoutes`, and `getIndexRoute` is deprecated. That argument is now the router state (`nextState` or `partialNextState`) rather than the location. To access the location, use `nextState.location` or `partialNextState.location`.')
          return location[prop]
        }
      })
    }

    return stateWithLocation
  }

  return { ...state, ...location }
}
