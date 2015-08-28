import warning from 'warning';
import useQueries from 'history/lib/useQueries';
import computeChangedRoutes from './computeChangedRoutes';
import { runEnterHooks, runLeaveHooks } from './TransitionUtils';
import { default as _isActive } from './isActive';
import getComponents from './getComponents';
import matchRoutes from './matchRoutes';

/**
 * Enhances a history object with the following methods:
 *
 * - isActive(pathname, query)
 * - registerRouteHook(route, (location) => {})
 * - unregisterRouteHook(route, (location) => {})
 * - listen((error, state) => {})
 * - match(location, (error, state) => {})
 */
function useRoutes(createHistory) {
  return function (options={}) {
    var { routes, ...historyOptions } = options;
    var history = useQueries(createHistory)(historyOptions);
    var state;

    function isActive(pathname, query) {
      return _isActive(pathname, query, state.location, state.routes, state.params);
    }

    function matchRoutesWithWarning(routes, location, callback) {
      matchRoutes(routes, location, function (error, nextState) {
        if (error || nextState) {
          callback(error, nextState);
        } else {
          warning(
            false,
            'Location "%s" did not match any routes',
            location.pathname + location.search
          );
        }
      });
    }

    // TODO: If we had a way to uniquely identify a route,
    // we could use a plain object here instead...
    var routeHooks = new Map();
    var partialNextState;

    function match(location, callback) {
      if (partialNextState && partialNextState.location === location) {
        // Continue from where we left off.
        finishMatch(partialNextState, callback);
      } else {
        matchRoutesWithWarning(routes, location, function (error, nextState) {
          if (error) {
            callback(error);
          } else {
            finishMatch({ ...nextState, location }, callback);
          }
        });
      }
    }

    function finishMatch(nextState, callback) {
      var { leaveRoutes, enterRoutes } = computeChangedRoutes(state, nextState);

      runLeaveHooks(leaveRoutes);

      runEnterHooks(enterRoutes, nextState, function (error, redirectInfo) {
        if (error) {
          callback(error);
        } else if (redirectInfo) {
          var { pathname, query, state } = redirectInfo;
          history.replaceState(state, pathname, query);
          callback();
        } else {
          // TODO: Fetch components after state is updated.
          getComponents(nextState.routes, function (error, components) {
            if (error) {
              callback(error);
            } else {
              callback(null, { ...nextState, components });
            }
          });
        }
      });
    }

    function getRouteHooksForRoutes(routes) {
      return routes.reduce(function (hooks, route) {
        hooks.push.apply(hooks, routeHooks.get(route));
        return hooks;
      }, []);
    }

    function transitionHook(location, callback) {
      matchRoutesWithWarning(routes, location, function (error, nextState) {
        if (error) {
          // TODO: Handle the error.
          callback(false); // Cancel the transition.
        } else {
          // Cache some state here so we don't have to
          // matchRoutes() again in the listen callback.
          partialNextState = { ...nextState, location };

          var hooks = getRouteHooksForRoutes(
            computeChangedRoutes(state, nextState).leaveRoutes
          );

          var result;
          for (var i = 0, len = hooks.length; result == null && i < len; ++i) {
            // Passing the location arg here indicates to
            // the user that this is a transition hook.
            result = hooks[i](location);
          }

          callback(result);
        }
      });
    }

    function beforeUnloadHook() {
      // Synchronously check to see if any route hooks want to 
      // prevent the current window/tab from closing.
      if (state && state.routes) {
        var hooks = getRouteHooksForRoutes(state.routes);

        var message;
        for (var i = 0, len = hooks.length; typeof message !== 'string' && i < len; ++i) {
          // Passing no args indicates to the user that this is a
          // beforeunload hook. We don't know the next location.
          message = hooks[i]();
        }

        return message;
      }
    }

    function registerRouteHook(route, hook) {
      // TODO: Warn if they register for a route that isn't currently
      // active. They're probably doing something wrong, like re-creating
      // route objects on every location change.
      var hooks = routeHooks.get(route);

      if (hooks == null) {
        routeHooks.set(route, (hooks = [ hook ]));

        if (routeHooks.size === 1) {
          history.registerTransitionHook(transitionHook);
          
          if (history.registerBeforeUnloadHook)
            history.registerBeforeUnloadHook(beforeUnloadHook);
        }
      } else if (hooks.indexOf(hook) === -1) {
        hooks.push(hook);
      }
    }

    function unregisterRouteHook(route, hook) {
      var hooks = routeHooks.get(route);
      
      if (hooks != null) {
        var newHooks = hooks.filter(item => item !== hook);

        if (newHooks.length === 0) {
          routeHooks.delete(route);

          if (routeHooks.size === 0) {
            history.unregisterTransitionHook(transitionHook);

            if (history.unregisterBeforeUnloadHook)
              history.unregisterBeforeUnloadHook(beforeUnloadHook);
          }
        } else {
          routeHooks.set(route, newHooks);
        }
      }
    }

    function dispatch(location, callback) {
      if (state && state.location === location) {
        callback(null, state);
        return;
      }

      match(location, function (error, nextState) {
        if (error) {
          callback(error);
        } else if (nextState) {
          callback(null, (state = nextState));
        }
      });
    }

    function listen(listener) {
      return history.listen(function (location) {
        dispatch(location, listener);
      });
    }

    return {
      ...history,
      isActive,
      registerRouteHook,
      unregisterRouteHook,
      listen,
      match
    };
  };
}

export default useRoutes;
