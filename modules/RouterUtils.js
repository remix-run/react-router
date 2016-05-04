export function createRouterObject(history, transitionManager) {
  return {
    ...history,
    listen: transitionManager.listen,
    setRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
    isActive: transitionManager.isActive
  }
}
