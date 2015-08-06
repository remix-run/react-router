import { loopAsync } from './AsyncUtils';
import { getParamNames } from './PatternUtils';

function routeParamsChanged(route, prevState, nextState) {
  if (!route.path)
    return false;

  var paramNames = getParamNames(route.path);

  return paramNames.some(function (paramName) {
    return prevState.params[paramName] !== nextState.params[paramName];
  });
}

function createTransitionHook(fn, context) {
  return function (a, b, callback) {
    fn.apply(context, arguments);

    if (fn.length < 3) {
      // Assume fn executes synchronously and
      // automatically call the callback.
      callback();
    }
  };
}

function getTransitionHooksFromRoutes(routes, hookName) {
  return routes.reduce(function (hooks, route) {
    if (route[hookName])
      hooks.push(createTransitionHook(route[hookName], route));

    return hooks;
  }, []);
}

function getTransitionHooks(prevState, nextState) {
  var prevRoutes = prevState && prevState.routes;
  var nextRoutes = nextState.routes;

  var leaveRoutes, enterRoutes;
  if (prevRoutes) {
    leaveRoutes = prevRoutes.filter(function (route) {
      return nextRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
    });

    // onLeave hooks start at the leaf route.
    leaveRoutes.reverse();

    enterRoutes = nextRoutes.filter(function (route) {
      return prevRoutes.indexOf(route) === -1 || leaveRoutes.indexOf(route) !== -1;
    });
  } else {
    leaveRoutes = [];
    enterRoutes = nextRoutes;
  }

  var hooks = getTransitionHooksFromRoutes(leaveRoutes, 'onLeave');

  hooks.push.apply(
    hooks,
    getTransitionHooksFromRoutes(enterRoutes, 'onEnter')
  );

  return hooks;
}

/**
 * Compiles and runs an array of transition hook functions that
 * should be called before we transition to a new state. Transition
 * hook signatures are:
 *
 *   - route.onEnter(nextState, redirectTo[, callback ])
 *   - route.onLeave(nextState, redirectTo[, callback ])
 *
 * Transition hooks run in order from the leaf route in the branch
 * we're leaving, up the tree to the common parent route, and back
 * down the branch we're entering to the leaf route.
 *
 * If a transition hook needs to execute asynchronously it may have
 * a 3rd argument that it should call when it is finished. Otherwise
 * the transition executes synchronously.
 */
function runTransitionHooks(prevState, nextState, callback) {
  var hooks = getTransitionHooks(prevState, nextState);

  var redirectInfo;
  function redirectTo(pathname, query, state) {
    redirectInfo = { pathname, query, state };
  }

  loopAsync(hooks.length, (index, next, done) => {
    hooks[index](nextState, redirectTo, (error) => {
      if (error || redirectInfo) {
        done(error, redirectInfo); // No need to continue.
      } else {
        next();
      }
    });
  }, callback);
}

export default runTransitionHooks;
