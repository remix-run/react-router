import { mapAsync } from './AsyncUtils'
import { canUseMembrane } from './deprecateObjectProperties'
import warning from './routerWarning'

function getComponentsForRoute(nextState, route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components)
    return
  }

  const getComponent = route.getComponent || route.getComponents
  if (getComponent) {
    let nextStateWithLocation = { ...nextState }
    const { location } = nextState

    if (__DEV__ && canUseMembrane) {
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
    } else {
      Object.assign(nextStateWithLocation, location)
    }

    getComponent.call(route, nextStateWithLocation, callback)
    return
  }

  callback()
}

/**
 * Asynchronously fetches all components needed for the given router
 * state and calls callback(error, components) when finished.
 *
 * Note: This operation may finish synchronously if no routes have an
 * asynchronous getComponents method.
 */
function getComponents(nextState, callback) {
  mapAsync(nextState.routes, function (route, index, callback) {
    getComponentsForRoute(nextState, route, callback)
  }, callback)
}

export default getComponents
