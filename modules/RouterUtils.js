export function createRouterObject(history, transitionManager, state) {
  return {
    ...history,
    setRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
    isActive: transitionManager.isActive,
    location: state.location,
    params: state.params
  }
}

export function updateRouterObjectState(router, { location, params }) {
  router.location = location
  router.params = params
}
