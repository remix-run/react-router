import { REPLACE } from 'history/lib/Actions'

import warning from './routerWarning'
import computeChangedRoutes from './computeChangedRoutes'
import { runEnterHooks, runChangeHooks, runLeaveHooks } from './TransitionUtils'
import _isActive from './isActive'
import getComponents from './getComponents'
import matchRoutes from './matchRoutes'

function hasAnyProperties(object) {
  for (const p in object)
    if (Object.prototype.hasOwnProperty.call(object, p))
      return true

  return false
}

export default function createTransitionManager(history, routes) {
  let state = {}

  // Signature should be (location, indexOnly), but needs to support (path,
  // query, indexOnly)
  function isActive(location, indexOnly) {
    location = history.createLocation(location)

    return _isActive(
      location, indexOnly, state.location, state.routes, state.params
    )
  }

  function createLocationFromRedirectInfo(location) {
    return history.createLocation(location, REPLACE)
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
    const { leaveRoutes, changeRoutes, enterRoutes } = computeChangedRoutes(state, nextState)

    runLeaveHooks(leaveRoutes)

    // Tear down confirmation hooks for left routes
    leaveRoutes
      .filter(route => enterRoutes.indexOf(route) === -1)
      .forEach(removeListenBeforeHooksForRoute)

    // change and enter hooks are run in series
    runChangeHooks(changeRoutes, state, nextState, (error, redirectInfo) => {
      if (error || redirectInfo)
        return handleErrorOrRedirect(error, redirectInfo)

      runEnterHooks(enterRoutes, nextState, finishEnterHooks)
    })

    function finishEnterHooks(error, redirectInfo) {
      if (error || redirectInfo)
        return handleErrorOrRedirect(error, redirectInfo)

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

    function handleErrorOrRedirect(error, redirectInfo) {
      if (error) callback(error)
      else callback(null, createLocationFromRedirectInfo(redirectInfo))
    }
  }

  let RouteGuid = 1

  function getRouteID(route, create = false) {
    return route.__id__ || create && (route.__id__ = RouteGuid++)
  }

  const RouteHooks = Object.create(null)

  function getRouteHooksForRoutes(routes) {
    return routes
      .map(route => RouteHooks[getRouteID(route)])
      .filter(hook => hook)
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

  /* istanbul ignore next: untestable with Karma */
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

  function removeListenBeforeHooksForRoute(route) {
    const routeID = getRouteID(route)
    if (!routeID) {
      return
    }

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
  }

  /**
   * Registers the given hook function to run before leaving the given route.
   *
   * During a normal transition, the hook function receives the next location
   * as its only argument and can return either a prompt message (string) to show the user,
   * to make sure they want to leave the page; or `false`, to prevent the transition.
   * Any other return value will have no effect.
   *
   * During the beforeunload event (in browsers) the hook receives no arguments.
   * In this case it must return a prompt message to prevent the transition.
   *
   * Returns a function that may be used to unbind the listener.
   */
  function listenBeforeLeavingRoute(route, hook) {
    const thereWereNoRouteHooks = !hasAnyProperties(RouteHooks)
    const routeID = getRouteID(route, true)

    RouteHooks[routeID] = hook

    if (thereWereNoRouteHooks) {
      // setup transition & beforeunload hooks
      unlistenBefore = history.listenBefore(transitionHook)

      if (history.listenBeforeUnload)
        unlistenBeforeUnload = history.listenBeforeUnload(beforeUnloadHook)
    }

    return function () {
      removeListenBeforeHooksForRoute(route)
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
