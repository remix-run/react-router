export function createRouterObject(history, transitionManager) {
  return {
    ...history,
    setRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
    isActive: transitionManager.isActive
  }
}
