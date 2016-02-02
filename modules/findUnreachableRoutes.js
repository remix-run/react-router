import { createMemoryHistory } from 'history'
import warning from './warning'

const createLocation = createMemoryHistory().createLocation

/**
 * Checks a Route for the component that SHOULD be rendered against the
 * component that WILL be rendered. If falsy, this indicates an
 * unreachable route.
 */
function verifyRouteIsReachable(path, route, transitionManager) {
  if (!path || !route) return

  // strip vars so the path becomes routable
  const cleanPath = path.replace(':', '').replace('*', 'splat')

  transitionManager.match(createLocation(cleanPath), (_, _1, state) => {
    if (!state) return
    warning(state.routes.indexOf(route) !== -1 , `<Route path='${path}' component=${route.component.name}> is an unreachable route. You may need to reorder your routes or fix a typo.`)
  })
}

/**
 * Loops through all the routes and will check for any unreachable routes.
 */
export function checkForUnreachableRoutes(transitionManager, routes = [], parentPath = '') {

  routes.forEach((route) => {

    let path = parentPath + '/' + route.path
    path = path.replace(/(\/\/+)/gi, '/') // replace multiple slashes with one

    if (route.path && route.component) { // FIXME: When does this occur?!?: I think when there isn't a parent path? When does that happen?
      verifyRouteIsReachable(path, route, transitionManager)
    }

    const { childRoutes } = route
    if (childRoutes) {
      checkForUnreachableRoutes(transitionManager, childRoutes, route.path)
    }
  })
}
