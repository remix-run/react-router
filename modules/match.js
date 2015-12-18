import invariant from 'invariant'
import createMemoryHistory from './createMemoryHistory'
import createTransitionManager from './createTransitionManager'
import { createRoutes } from './RouteUtils'

/**
 * A high-level API to be used for server-side rendering.
 *
 * This function matches a location to a set of routes and calls
 * callback(error, redirectLocation, renderProps) when finished.
 *
 * Note: You probably don't want to use this in a browser. Use
 * the history.listen API instead.
 */
function match({ routes, location, ...options }, callback) {
  invariant(
    location,
    'match needs a location'
  )

  const history = createMemoryHistory(options)
  const transitionManager = createTransitionManager(
    history,
    createRoutes(routes)
  )

  // polyfill deprecated history API
  history.isActive = transitionManager.isActive

  // Allow match({ location: '/the/path', ... })
  if (typeof location === 'string')
    location = history.createLocation(location)

  transitionManager.match(location, function (error, redirectLocation, nextState) {
    callback(
      error,
      redirectLocation,
      nextState && { ...nextState, history, transitionManager }
    )
  })
}

export default match
