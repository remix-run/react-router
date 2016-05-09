export function createRouterObject(history, transitionManager, state) {
  const router = {
    ...history,
    setRouteLeaveHook: transitionManager.listenBeforeLeavingRoute,
    isActive: transitionManager.isActive
  }

  return assignRouterState(router, state)
}

export function assignRouterState(router, { location, params, routes }) {
  router.location = location
  router.params = params
  router.routes = routes

  return router
}
