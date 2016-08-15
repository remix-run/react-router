import { mapAsync } from './AsyncUtils'
import { isPromise } from './PromiseUtils'

function getComponentsForRoute(nextState, route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components)
    return
  }

  const getComponent = route.getComponent || route.getComponents
  if (getComponent) {
    const componentReturn = getComponent.call(route, nextState, callback)
    if (isPromise(componentReturn))
      componentReturn
        .then(
          component => callback(null, component),
          callback
        )
  } else {
    callback()
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
