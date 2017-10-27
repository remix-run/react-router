
/**
 * This action type will be dispatched by the history actions below.
 * If you're writing a middleware to watch for navigation events, be sure to
 * look for actions of this type.
 */
export const CALL_HISTORY_METHOD = '@@router/CALL_HISTORY_METHOD'

function updateLocation(method) {
  return (namespace) => (...args) => ({
    type: CALL_HISTORY_METHOD,
    payload: { method, args, namespace }
  })
}

/**
 * These actions correspond to the history API.
 * The associated routerMiddleware will capture these events before they get to
 * your reducer and reissue them as the matching function on your history.
 */
export const namespacedPush = updateLocation('push')
export const namespacedReplace = updateLocation('replace')
export const namespacedGo = updateLocation('go')
export const namespacedGoBack = updateLocation('goBack')
export const namespacedGoForward = updateLocation('goForward')

export const push = namespacedPush()
export const replace = namespacedReplace()
export const go = namespacedGo()
export const goBack = namespacedGoBack()
export const goForward = namespacedGoForward()

export const routerActions = { push, replace, go, goBack, goForward }
export const namespacedRouterActions = (namespace) => ({
  push: namespacedPush(namespace),
  replace: namespacedReplace(namespace),
  go: namespacedGo(namespace),
  goBack: namespacedGoBack(namespace),
  goForward: namespacedGoForward(namespace),
})
