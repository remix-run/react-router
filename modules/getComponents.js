import { mapAsync } from './AsyncUtils';

function getComponentsForRoute(route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
  } else if (route.getComponents) {
    route.getComponents(callback);
  } else {
    callback();
  }
}

function getComponentsForRoutes(routes, callback) {
  mapAsync(routes, function (route, index, callback) {
    getComponentsForRoute(route, callback);
  }, callback);
}

/**
 * Asynchronously fetches all components needed for the given router
 * state and calls callback(error, components) when finished.
 *
 * Note: This operation may return synchronously if no routes have an
 * asynchronous getComponents method.
 */
export function getComponents(props, callback) {
  getComponentsForRoutes(props.branch, callback);
}

/**
 * Assigns the result of getComponents to props.components.
 */
export function getAndAssignComponents(props, callback) {
  getComponents(props, function (error, components) {
    if (!error)
      props.components = components;

    callback(error);
  });
}
