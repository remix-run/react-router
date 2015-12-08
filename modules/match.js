import invariant from 'invariant'
import warning from 'warning'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import useBasename from 'history/lib/useBasename'
import { createRoutes } from './RouteUtils'
import useRoutes from './useRoutes'

const createHistory = useRoutes(useBasename(createMemoryHistory))

/**
 * A high-level API to be used for server-side rendering.
 *
 * This function matches a location to a set of routes and calls
 * callback(error, redirectLocation, renderProps) when finished.
 *
 * Note: You probably don't want to use this in a browser. Use
 * the history.listen API instead.
 */
function match({
  routes,
  path,
  location,
  ...options
}, callback) {
  invariant(
    path || location,
    'match needs a path or location'
  )

  const history = createHistory({
    routes: createRoutes(routes),
    ...options
  })

  warning(
    location == null,
    '`match({ location, ...options })` is deprecated; use `match({ path, ...options })` instead'
  )

  if (path) {
    location = history.createLocation(path)
  } else if (typeof location === 'string') {
    location = history.createLocation(location)
  }

  history.match(location, function (error, redirectLocation, nextState) {
    callback(error, redirectLocation, nextState && { ...nextState, history })
  })
}

export default match
