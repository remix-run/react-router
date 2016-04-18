import invariant from 'invariant'

import createMemoryHistory from './createMemoryHistory'
import createTransitionManager from './createTransitionManager'
import { createRoutes } from './RouteUtils'
import { createRouterObject } from './RouterUtils'

/**
 * A high-level API to be used for server-side rendering.
 *
 * This function matches a location to a set of routes and calls
 * callback(error, redirectLocation, renderProps) when finished.
 *
 * Note: You probably don't want to use this in a browser unless you're using
 * server-side rendering with async routes.
 */
function match({ history, routes, location, ...options }, callback) {
  invariant(
    history || location,
    'match needs a history or a location'
  )

  history = history ? history : createMemoryHistory(options)
  const transitionManager = createTransitionManager(
    history,
    createRoutes(routes)
  )

  let unlisten

  if (location) {
    // Allow match({ location: '/the/path', ... })
    location = history.createLocation(location)
  } else {
    // Pick up the location from the history via synchronous history.listen
    // call if needed.
    unlisten = history.listen(historyLocation => {
      location = historyLocation
    })
  }

  const router = createRouterObject(history, transitionManager)
  history = { ...history, ...transitionManager }

  transitionManager.match(location, function (error, redirectLocation, nextState) {
    callback(
      error,
      redirectLocation,
      nextState && {
        ...nextState,
        history,
        router,
        matchContext: { history, transitionManager, router }
      }
    )

    // Defer removing the listener to here to prevent DOM histories from having
    // to unwind DOM event listeners unnecessarily, in case callback renders a
    // <Router> and attaches another history listener.
    if (unlisten) {
      unlisten()
    }
  })
}

export default match
