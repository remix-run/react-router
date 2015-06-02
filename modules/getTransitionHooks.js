import { getParamNames } from './PathUtils';

/**
 * Returns true if the params a route cares about changed in
 * the transition from prevState to nextState, false otherwise.
 */
function routeParamsChanged(route, prevState, nextState) {
  if (!route.path)
    return false;

  var paramNames = getParamNames(route.path);

  return paramNames.some(function (paramName) {
    return prevState.params[paramName] !== nextState.params[paramName];
  });
}

/**
 * Compiles and returns an array of transition hook functions that
 * should be called before we transition to a new state. Transition
 * hook signatures are:
 *
 *   - route.onLeave(nextState, router)
 *   - route.onEnter(nextState, router)
 *
 * Transition hooks run in order from the leaf route in the branch
 * we're leaving, up the tree to the common parent route, and back
 * down the branch we're entering to the leaf route.
 */
export function getTransitionHooks(prevState, nextState, router) {
  var fromRoutes = prevState && prevState.branch;
  var toRoutes = nextState.branch;
  var hooks = [];

  if (fromRoutes) {
    function isLeavingRoute(route) {
      return toRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
    }

    var leavingRoutes = [];

    fromRoutes.forEach(function (route, index) {
      if (isLeavingRoute(route)) {
        leavingRoutes.push(route);

        if (route.onLeave)
          hooks.push(route.onLeave.bind(route, nextState, router));
      }
    });

    // Call "leave" hooks starting at the leaf route.
    hooks.reverse();

    function isEnteringRoute(route) {
      return fromRoutes.indexOf(route) === -1 || leavingRoutes.indexOf(route) !== -1;
    }

    toRoutes.forEach(function (route, index) {
      if (isEnteringRoute(route) && route.onEnter)
        hooks.push(route.onEnter.bind(route, nextState, router));
    });
  } else {
    toRoutes.forEach(function (route, index) {
      if (route.onEnter)
        hooks.push(route.onEnter.bind(route, nextState, router));
    });
  }

  return hooks;
}
