import deprecateObjectProperties from './deprecateObjectProperties'

export function createRouterObject(history, transitionManager) {
  return {
    ...history,
    addRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
    isActive: transitionManager.isActive
  }
}

// deprecated
export function createRoutingHistory(history, transitionManager) {
  history = {
    ...history,
    ...transitionManager
  }

  if (__DEV__) {
    history = deprecateObjectProperties(
      history,
      '`props.history` and `context.history` are deprecated; use `props.router` on route components and `context.router` on deeper components.'
    )
  }

  return history
}
