import { mapAsync } from './AsyncUtils'

function getComponentsForRoute(nextState, route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components)
    return
  }

  const getComponent = route.getComponent || route.getComponents
  if (!getComponent) {
    callback()
  } else {
    getComponent.call(route, nextState, callback)
  }
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
