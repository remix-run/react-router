import warning from './warning'
import { REPLACE } from 'history/lib/Actions'
import computeChangedRoutes from './computeChangedRoutes'
import { runEnterHooks, runLeaveHooks } from './TransitionUtils'
import { default as _isActive } from './isActive'
import getComponents from './getComponents'
import matchRoutes from './matchRoutes'

function hasAnyProperties(object) {
  for (const p in object)
    if (object.hasOwnProperty(p))
      return true

  return false
}

export default function createTransitionManager(history, routes) {
  let state = {}

  function isActive(pathname, query, indexOnly=false) {
    return _isActive(pathname, query, indexOnly, state.location, state.routes, state.params)
  }

  function createLocationFromRedirectInfo({ pathname, query, state }) {
    return history.createLocation(
      history.createPath(pathname, query), state, REPLACE
    )
  }

  let partialNextState

  function match(location, callback) {
    if (partialNextState && partialNextState.location === location) {
      // Continue from where we left off.
      finishMatch(partialNextState, callback)
    } else {
      matchRoutes(routes, location, function (error, nextState) {
        if (error) {
          callback(error)
        } else if (nextState) {
          finishMatch({ ...nextState, location }, callback)
        } else {
          callback()
        }
      })
    }
  }

  function finishMatch(nextState, callback) {
    const { leaveRoutes, enterRoutes } = computeChangedRoutes(state, nextState)

    runLeaveHooks(leaveRoutes)

    runEnterHooks(enterRoutes, nextState, function (error, redirectInfo) {
      if (error) {
        callback(error)
      } else if (redirectInfo) {
        callback(null, createLocationFromRedirectInfo(redirectInfo))
      } else {
        // TODO: Fetch components after state is updated.
        getComponents(nextState, function (error, components) {
          if (error) {
            callback(error)
          } else {
            // TODO: Make match a pure function and have some other API
            // for "match and update state".
            callback(null, null, (
              state = { ...nextState, components })
            )
          }
        })
      }
    })
  }

  let RouteGuid = 1

  function getRouteID(route) {
    return route.__id__ || (route.__id__ = RouteGuid++)
  }

  const RouteHooks = {}

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

      const hooks = getRouteHooksForRoutes(
        computeChangedRoutes(state, partialNextState).leaveRoutes
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
    // Synchronously check to see if any route hooks want
    // to prevent the current window/tab from closing.
    if (state.routes) {
      const hooks = getRouteHooksForRoutes(state.routes)

      let message
      for (let i = 0, len = hooks.length; typeof message !== 'string' && i < len; ++i) {
        // Passing no args indicates to the user that this is a
        // beforeunload hook. We don't know the next location.
        message = hooks[i]()
      }

      return message
    }
  }

  let unlistenBefore, unlistenBeforeUnload

  /**
   * Registers the given hook function to run before leaving the given route.
   *
   * During a normal transition, the hook function receives the next location
   * as its only argument and must return either a) a prompt message to show
   * the user, to make sure they want to leave the page or b) false, to prevent
   * the transition.
   *
   * During the beforeunload event (in browsers) the hook receives no arguments.
   * In this case it must return a prompt message to prevent the transition.
   *
   * Returns a function that may be used to unbind the listener.
   */
  function listenBeforeLeavingRoute(route, hook) {
    // TODO: Warn if they register for a route that isn't currently
    // active. They're probably doing something wrong, like re-creating
    // route objects on every location change.
    const routeID = getRouteID(route)
    let hooks = RouteHooks[routeID]

    if (hooks == null) {
      let thereWereNoRouteHooks = !hasAnyProperties(RouteHooks)

      hooks = RouteHooks[routeID] = [ hook ]

      if (thereWereNoRouteHooks) {
        // setup transition & beforeunload hooks
        unlistenBefore = history.listenBefore(transitionHook)

        if (history.listenBeforeUnload)
          unlistenBeforeUnload = history.listenBeforeUnload(beforeUnloadHook)
      }
    } else if (hooks.indexOf(hook) === -1) {
      hooks.push(hook)
    }

    return function () {
      const hooks = RouteHooks[routeID]

      if (hooks != null) {
        const newHooks = hooks.filter(item => item !== hook)

        if (newHooks.length === 0) {
          delete RouteHooks[routeID]

          if (!hasAnyProperties(RouteHooks)) {
            // teardown transition & beforeunload hooks
            if (unlistenBefore) {
              unlistenBefore()
              unlistenBefore = null
            }

            if (unlistenBeforeUnload) {
              unlistenBeforeUnload()
              unlistenBeforeUnload = null
            }
          }
        } else {
          RouteHooks[routeID] = newHooks
        }
      }
    }
  }

  /**
   * This is the API for stateful environments. As the location
   * changes, we update state and call the listener. We can also
   * gracefully handle errors and redirects.
   */
  function listen(listener) {
    // TODO: Only use a single history listener. Otherwise we'll
    // end up with multiple concurrent calls to match.
    return history.listen(function (location) {
      if (state.location === location) {
        listener(null, state)
      } else {
        match(location, function (error, redirectLocation, nextState) {
          if (error) {
            listener(error)
          } else if (redirectLocation) {
            history.transitionTo(redirectLocation)
          } else if (nextState) {
            listener(null, nextState)
          } else {
            warning(
              false,
              'Location "%s" did not match any routes',
              location.pathname + location.search + location.hash
            )
          }
        })
      }
    })
  }

  return {
    isActive,
    match,
    listenBeforeLeavingRoute,
    listen
  }
}

//export default useRoutes
