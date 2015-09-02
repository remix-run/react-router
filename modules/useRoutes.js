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
 * - match(location, (error, nextState, redirectInfo) => {})
 * - listen((error, nextState) => {})
 */
function useRoutes(createHistory) {
  return function (options={}) {
    let { routes, ...historyOptions } = options;
    let history = useQueries(createHistory)(historyOptions);
    let state = {};

    function isActive(pathname, query, indexOnly=false) {
      return _isActive(pathname, query, indexOnly, state.location, state.routes, state.params);
    }

    // TODO: If we had a way to uniquely identify a route,
    // we could use a plain object here instead...
    let routeHooks = new Map();
    let partialNextState;

    function match(location, callback) {
      if (partialNextState && partialNextState.location === location) {
        // Continue from where we left off.
        finishMatch(partialNextState, callback);
      } else {
        matchRoutes(routes, location, function (error, nextState) {
          if (error || nextState == null) {
            callback(error, nextState);
          } else {
            finishMatch({ ...nextState, location }, callback);
          }
        });
      }
    }

    function finishMatch(nextState, callback) {
      let { leaveRoutes, enterRoutes } = computeChangedRoutes(state, nextState);

      runLeaveHooks(leaveRoutes);

      runEnterHooks(enterRoutes, nextState, function (error, redirectInfo) {
        if (error) {
          callback(error);
        } else if (redirectInfo) {
          callback(null, null, redirectInfo);
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
      matchRoutes(routes, location, function (error, nextState) {
        if (nextState == null) {
          // TODO: We didn't actually match anything, but hang
          // onto error/nextState so we don't have to matchRoutes
          // again in the listen callback.
          callback();
          return;
        }

        // Cache some state here so we don't have to
        // matchRoutes() again in the listen callback.
        partialNextState = { ...nextState, location };

        let hooks = getRouteHooksForRoutes(
          computeChangedRoutes(state, nextState).leaveRoutes
        );

        let result;
        for (let i = 0, len = hooks.length; result == null && i < len; ++i) {
          // Passing the location arg here indicates to
          // the user that this is a transition hook.
          result = hooks[i](location);
        }

        callback(result);
      });
    }

    function beforeUnloadHook() {
      // Synchronously check to see if any route hooks want to 
      // prevent the current window/tab from closing.
      if (state.routes) {
        let hooks = getRouteHooksForRoutes(state.routes);

        let message;
        for (let i = 0, len = hooks.length; typeof message !== 'string' && i < len; ++i) {
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
      let hooks = routeHooks.get(route);

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
      let hooks = routeHooks.get(route);
      
      if (hooks != null) {
        let newHooks = hooks.filter(item => item !== hook);

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

    /**
     * This is the API for stateful environments. As the location changes,
     * we update state and call the listener. Benefits of this API are:
     *
     * - We automatically manage state on the client
     * - We automatically handle redirects on the client
     * - We warn when the location doesn't match any routes
     */
    function listen(listener) {
      return history.listen(function (location) {
        if (state.location === location) {
          listener(null, state);
        } else {
          match(location, function (error, nextState, redirectInfo) {
            if (error) {
              listener(error);
            } else if (nextState) {
              listener(null, (state = nextState));
            } else if (redirectInfo) {
              let { pathname, query, state } = redirectInfo;
              history.replaceState(state, pathname, query);
            } else {
              warning(
                false,
                'Location "%s" did not match any routes',
                location.pathname + location.search
              );
            }
          });
        }
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
