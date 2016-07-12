import { loopAsync } from './AsyncUtils'

function createTransitionHook(hook, route, asyncArity) {
  return function (...args) {
    hook.apply(route, args)

    if (hook.length < asyncArity) {
      let callback = args[args.length - 1]
      // Assume hook executes synchronously and
      // automatically call the callback.
      callback()
    }
  }
}

function getEnterHooks(routes) {
  return routes.reduce(function (hooks, route) {
    if (route.onEnter)
      hooks.push(createTransitionHook(route.onEnter, route, 3))

    return hooks
  }, [])
}

function getChangeHooks(routes) {
  return routes.reduce(function (hooks, route) {
    if (route.onChange)
      hooks.push(createTransitionHook(route.onChange, route, 4))
    return hooks
  }, [])
}

function runTransitionHooks(length, iter, callback) {
  if (!length) {
    callback()
    return
  }

  let redirectInfo
  function replace(location) {
    redirectInfo = location
  }

  loopAsync(length, function (index, next, done) {
    iter(index, replace, function (error) {
      if (error || redirectInfo) {
        done(error, redirectInfo) // No need to continue.
      } else {
        next()
      }
    })
  }, callback)
}

/**
 * Runs all onEnter hooks in the given array of routes in order
 * with onEnter(nextState, replace, callback) and calls
 * callback(error, redirectInfo) when finished. The first hook
 * to use replace short-circuits the loop.
 *
 * If a hook needs to run asynchronously, it may use the callback
 * function. However, doing so will cause the transition to pause,
 * which could lead to a non-responsive UI if the hook is slow.
 */
export function runEnterHooks(routes, nextState, callback) {
  const hooks = getEnterHooks(routes)
  return runTransitionHooks(hooks.length, (index, replace, next) => {
    hooks[index](nextState, replace, next)
  }, callback)
}

/**
 * Runs all onChange hooks in the given array of routes in order
 * with onChange(prevState, nextState, replace, callback) and calls
 * callback(error, redirectInfo) when finished. The first hook
 * to use replace short-circuits the loop.
 *
 * If a hook needs to run asynchronously, it may use the callback
 * function. However, doing so will cause the transition to pause,
 * which could lead to a non-responsive UI if the hook is slow.
 */
export function runChangeHooks(routes, state, nextState, callback) {
  const hooks = getChangeHooks(routes)
  return runTransitionHooks(hooks.length, (index, replace, next) => {
    hooks[index](state, nextState, replace, next)
  }, callback)
}

/**
 * Runs all onLeave hooks in the given array of routes in order.
 */
export function runLeaveHooks(routes, prevState) {
  for (let i = 0, len = routes.length; i < len; ++i)
    if (routes[i].onLeave)
      routes[i].onLeave.call(routes[i], prevState)
}
