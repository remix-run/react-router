import { loopAsync } from './AsyncUtils'

function createEnterHook(hook, route) {
  return function (a, b, callback) {
    hook.apply(route, arguments)

    if (hook.length < 3) {
      // Assume hook executes synchronously and
      // automatically call the callback.
      callback()
    }
  }
}

function getEnterHooks(routes) {
  return routes.reduce(function (hooks, route) {
    if (route.onEnter)
      hooks.push(createEnterHook(route.onEnter, route))

    return hooks
  }, [])
}

/**
 * Runs all onEnter hooks in the given array of routes in order
 * with onEnter(nextState, replaceState, callback) and calls
 * callback(error, redirectInfo) when finished. The first hook
 * to use replaceState short-circuits the loop.
 *
 * If a hook needs to run asynchronously, it may use the callback
 * function. However, doing so will cause the transition to pause,
 * which could lead to a non-responsive UI if the hook is slow.
 */
export function runEnterHooks(routes, nextState, callback) {
  const hooks = getEnterHooks(routes)

  if (!hooks.length) {
    callback()
    return
  }

  let redirectInfo
  function replaceState(state, pathname, query) {
    redirectInfo = { pathname, query, state }
  }

  loopAsync(hooks.length, function (index, next, done) {
    hooks[index](nextState, replaceState, function (error) {
      if (error || redirectInfo) {
        done(error, redirectInfo) // No need to continue.
      } else {
        next()
      }
    })
  }, callback)
}

/**
 * Runs all onLeave hooks in the given array of routes in order.
 */
export function runLeaveHooks(routes) {
  for (let i = 0, len = routes.length; i < len; ++i)
    if (routes[i].onLeave)
      routes[i].onLeave.call(routes[i])
}
