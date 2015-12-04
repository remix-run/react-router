'use strict';

exports.__esModule = true;

var _AsyncUtils = require('./AsyncUtils');

function getComponentsForRoute(location, route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
  } else if (route.getComponent) {
    route.getComponent(location, callback);
  } else if (route.getComponents) {
    route.getComponents(location, callback);
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
function getComponents(nextState, callback) {
  _AsyncUtils.mapAsync(nextState.routes, function (route, index, callback) {
    getComponentsForRoute(nextState.location, route, callback);
  }, callback);
}

exports['default'] = getComponents;
module.exports = exports['default'];