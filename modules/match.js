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

  if (location) {
    // Allow match({ location: '/the/path', ... })
    location = history.createLocation(location)
  } else {
    location = history.getCurrentLocation()
  }

  transitionManager.match(location, (error, redirectLocation, nextState) => {
    let renderProps

    if (nextState) {
      const router = createRouterObject(history, transitionManager, nextState)
      renderProps = {
        ...nextState,
        router,
        matchContext: { transitionManager, router }
      }
    }

    callback(error, redirectLocation, renderProps)
  })
}

export default match
