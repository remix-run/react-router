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
      'routing history is deprecated; use the `router` object instead'
    )
  }

  return history
}
