import { getParamNames } from './PatternUtils'

function routeParamsChanged(route, prevState, nextState) {
  if (!route.path)
    return false

  const paramNames = getParamNames(route.path)

  return paramNames.some(function (paramName) {
    return prevState.params[paramName] !== nextState.params[paramName]
  })
}

/**
 * Returns an object of { leaveRoutes, enterRoutes } determined by
 * the change from prevState to nextState. We leave routes if either
 * 1) they are not in the next state or 2) they are in the next state
 * but their params have changed (i.e. /users/123 => /users/456).
 *
 * leaveRoutes are ordered starting at the leaf route of the tree
 * we're leaving up to the common parent route. enterRoutes are ordered
 * from the top of the tree we're entering down to the leaf route.
 */
function computeChangedRoutes(prevState, nextState) {
  const prevRoutes = prevState && prevState.routes
  const nextRoutes = nextState.routes

  let leaveRoutes, enterRoutes
  if (prevRoutes) {
    leaveRoutes = prevRoutes.filter(function (route) {
      return nextRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState)
    })

    // onLeave hooks start at the leaf route.
    leaveRoutes.reverse()

    enterRoutes = nextRoutes.filter(function (route) {
      return prevRoutes.indexOf(route) === -1 || leaveRoutes.indexOf(route) !== -1
    })
  } else {
    leaveRoutes = []
    enterRoutes = nextRoutes
  }

  return {
    leaveRoutes,
    enterRoutes
  }
}

export default computeChangedRoutes
