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
 * Returns an object of { leaveRoutes, changeRoutes, enterRoutes } determined by
 * the change from prevState to nextState. We leave routes if either
 * 1) they are not in the next state or 2) they are in the next state
 * but their params have changed (i.e. /users/123 => /users/456).
 *
 * leaveRoutes are ordered starting at the leaf route of the tree
 * we're leaving up to the common parent route. enterRoutes are ordered
 * from the top of the tree we're entering down to the leaf route.
 *
 * changeRoutes are any routes that didn't leave or enter during
 * the transition.
 */
function computeChangedRoutes(prevState, nextState) {
  const prevRoutes = prevState && prevState.routes
  const nextRoutes = nextState.routes

  let leaveRoutes, changeRoutes, enterRoutes
  if (prevRoutes) {
    leaveRoutes = prevRoutes.filter(function (route) {
      return nextRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState)
    })

    // onLeave hooks start at the leaf route.
    leaveRoutes.reverse()

    enterRoutes = []
    changeRoutes = []

    nextRoutes.forEach(function (route) {
      const isNew = prevRoutes.indexOf(route) === -1
      const paramsChanged = leaveRoutes.indexOf(route) !== -1

      if (isNew || paramsChanged)
        enterRoutes.push(route)
      else
        changeRoutes.push(route)
    })

  } else {
    leaveRoutes = []
    changeRoutes = []
    enterRoutes = nextRoutes
  }

  return {
    leaveRoutes,
    changeRoutes,
    enterRoutes
  }
}

export default computeChangedRoutes
