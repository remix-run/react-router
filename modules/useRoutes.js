import useQueries from 'history/lib/useQueries'

import createTransitionManager from './createTransitionManager'
import warning from './routerWarning'

/**
 * Returns a new createHistory function that may be used to create
 * history objects that know about routing.
 *
 * Enhances history objects with the following methods:
 *
 * - listen((error, nextState) => {})
 * - listenBeforeLeavingRoute(route, (nextLocation) => {})
 * - match(location, (error, redirectLocation, nextState) => {})
 * - isActive(pathname, query, indexOnly=false)
 */
function useRoutes(createHistory) {
  warning(
    false,
    '`useRoutes` is deprecated. Please use `createTransitionManager` instead.'
  )

  return function ({ routes, ...options } = {}) {
    const history = useQueries(createHistory)(options)
    const transitionManager = createTransitionManager(history, routes)
    return { ...history, ...transitionManager }
  }
}

export default useRoutes
