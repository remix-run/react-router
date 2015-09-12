import warning from 'warning'
import { REPLACE } from 'history/lib/Actions'
import useQueries from 'history/lib/useQueries'
import createLocation from 'history/lib/createLocation'
import computeChangedRoutes from './computeChangedRoutes'
import { runEnterHooks, runLeaveHooks } from './TransitionUtils'
import { default as _isActive } from './isActive'
import getComponents from './getComponents'
import matchRoutes from './matchRoutes'

function hasAnyProperties(object) {
  for (var p in object)
    if (object.hasOwnProperty(p))
      return true

  return false
}

/**
 * Returns a new createHistory function that may be used to create
 * history objects that know about routing.
 *
 * - isActive(pathname, query)
 * - registerRouteHook(route, (location) => {})
 * - unregisterRouteHook(route, (location) => {})
 * - match(location, (error, nextState, nextLocation) => {})
 * - listen((error, nextState) => {})
 */
function useRoutes(createHistory) {
  return function (options={}) {
    let { routes, ...historyOptions } = options
    let history = useQueries(createHistory)(historyOptions)
    let state = {}

    function isActive(pathname, query, indexOnly=false) {
      return _isActive(pathname, query, indexOnly, state.location, state.routes, state.params)
    }

    let partialNextState

    function match(location, callback) {
      if (partialNextState && partialNextState.location === location) {
        // Continue from where we left off.
        finishMatch(partialNextState, callback)
      } else {
        matchRoutes(routes, location, function (error, nextState) {
          if (error) {
            callback(error, null, null)
          } else if (nextState) {
            finishMatch({ ...nextState, location }, function (err, nextLocation, nextState) {
              if (nextState)
                state = nextState
              callback(err, nextLocation, nextState)
            })
          } else {
            callback(null, null, null)
          }
        })
      }
    }

    function createLocationFromRedirectInfo({ pathname, query, state }) {
      return createLocation(
        history.createPath(pathname, query), state, REPLACE, history.createKey()
      )
    }

    function finishMatch(nextState, callback) {
      let { leaveRoutes, enterRoutes } = computeChangedRoutes(state, nextState)

      runLeaveHooks(leaveRoutes)

      runEnterHooks(enterRoutes, nextState, function (error, redirectInfo) {
        if (error) {
          callback(error)
        } else if (redirectInfo) {
          callback(null, createLocationFromRedirectInfo(redirectInfo), null)
        } else {
          // TODO: Fetch components after state is updated.
          getComponents(nextState, function (error, components) {
            if (error) {
              callback(error)
            } else {
              callback(null, null, { ...nextState, components })
            }
          })
        }
      })
    }

    const RouteHooks = {}

    let RouteGuid = 1

    function getRouteID(route) {
      return route.__id__ || (route.__id__ = RouteGuid++)
    }

    function getRouteHooksForRoutes(routes) {
      return routes.reduce(function (hooks, route) {
        hooks.push.apply(hooks, RouteHooks[getRouteID(route)])
        return hooks
      }, [])
    }

    function transitionHook(location, callback) {
      matchRoutes(routes, location, function (error, nextState) {
        if (nextState == null) {
          // TODO: We didn't actually match anything, but hang
          // onto error/nextState so we don't have to matchRoutes
          // again in the listen callback.
          callback()
          return
        }

        // Cache some state here so we don't have to
        // matchRoutes() again in the listen callback.
        partialNextState = { ...nextState, location }

        let hooks = getRouteHooksForRoutes(
          computeChangedRoutes(state, nextState).leaveRoutes
        )

        let result
        for (let i = 0, len = hooks.length; result == null && i < len; ++i) {
          // Passing the location arg here indicates to
          // the user that this is a transition hook.
          result = hooks[i](location)
        }

        callback(result)
      })
    }

    function beforeUnloadHook() {
      // Synchronously check to see if any route hooks want to
      // prevent the current window/tab from closing.
      if (state.routes) {
        let hooks = getRouteHooksForRoutes(state.routes)

        let message
        for (let i = 0, len = hooks.length; typeof message !== 'string' && i < len; ++i) {
          // Passing no args indicates to the user that this is a
          // beforeunload hook. We don't know the next location.
          message = hooks[i]()
        }

        return message
      }
    }

    function registerRouteHook(route, hook) {
      // TODO: Warn if they register for a route that isn't currently
      // active. They're probably doing something wrong, like re-creating
      // route objects on every location change.
      let routeID = getRouteID(route)
      let hooks = RouteHooks[routeID]

      if (hooks == null) {
        let thereWereNoRouteHooks = !hasAnyProperties(RouteHooks)

        hooks = RouteHooks[routeID] = [ hook ]

        if (thereWereNoRouteHooks) {
          history.registerTransitionHook(transitionHook)

          if (history.registerBeforeUnloadHook)
            history.registerBeforeUnloadHook(beforeUnloadHook)
        }
      } else if (hooks.indexOf(hook) === -1) {
        hooks.push(hook)
      }
    }

    function unregisterRouteHook(route, hook) {
      let routeID = getRouteID(route)
      let hooks = RouteHooks[routeID]

      if (hooks != null) {
        let newHooks = hooks.filter(item => item !== hook)

        if (newHooks.length === 0) {
          delete RouteHooks[routeID]

          if (!hasAnyProperties(RouteHooks)) {
            history.unregisterTransitionHook(transitionHook)

            if (history.unregisterBeforeUnloadHook)
              history.unregisterBeforeUnloadHook(beforeUnloadHook)
          }
        } else {
          RouteHooks[routeID] = newHooks
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
          listener(null, state)
        } else {
          match(location, function (error, nextLocation, nextState) {
            if (error) {
              listener(error)
            } else if (nextState) {
              listener(null, state) // match mutates state to nextState
            } else if (nextLocation) {
              history.transitionTo(nextLocation)
            } else {
              warning(
                false,
                'Location "%s" did not match any routes',
                location.pathname + location.search
              )
            }
          })
        }
      })
    }

    return {
      ...history,
      isActive,
      registerRouteHook,
      unregisterRouteHook,
      listen,
      match
    }
  }
}

export default useRoutes
