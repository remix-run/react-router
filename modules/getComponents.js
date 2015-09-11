import { mapAsync } from './AsyncUtils';

function getComponentsForRoute(nextState, route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
  } else if (route.getComponent) {
    route.getComponent(callback);
  } else if (route.getComponents) {
    route.getComponents(nextState, callback);
  } else {
    callback();
  }
}

/**
 * Asynchronously fetches all components needed for the given router
 * state and calls callback(error, components) when finished.
 *
 * Note: This operation may finish synchronously if no routes have an
 * asynchronous getComponents method.
 */
function getComponents(routes, callback) {
  mapAsync(routes, function (route, index, callback) {
    getComponentsForRoute(nextState, route, callback);
  }, callback);
}

export default getComponents;
