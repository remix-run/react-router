import deprecateObjectProperties from './deprecateObjectProperties'

export function createRouterObject(history, transitionManager) {
  return {
    ...history,
    setRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
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
      '`props.history` and `context.history` are deprecated. Please use `context.router`. http://bit.ly/1mj4IZr'
    )
  }

  return history
}
