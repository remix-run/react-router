import warning from 'warning'
import invariant from 'invariant'
import { createLocation } from './LocationUtils'
import {
  addLeadingSlash,
  stripTrailingSlash,
  stripPrefix,
  parsePath,
  createPath
} from './PathUtils'
import createTransitionManager from './createTransitionManager'
import {
  canUseDOM,
  addEventListener,
  removeEventListener,
  getConfirmation,
  supportsHistory,
  supportsPopStateOnHashChange,
  isExtraneousPopstateEvent
} from './DOMUtils'

const PopStateEvent = 'popstate'
const HashChangeEvent = 'hashchange'

const getHistoryState = () => {
  try {
    return window.history.state || {}
  } catch (e) {
    // IE 11 sometimes throws when accessing window.history.state
    // See https://github.com/ReactTraining/history/pull/289
    return {}
  }
}

/**
 * Creates a history object that uses the HTML5 history API including
 * pushState, replaceState, and the popstate event.
 */
const createBrowserHistory = (props = {}) => {
  invariant(
    canUseDOM,
    'Browser history needs a DOM'
  )

  const globalHistory = window.history
  const canUseHistory = supportsHistory()
  const needsHashChangeListener = !supportsPopStateOnHashChange()

  const {
    forceRefresh = false,
    getUserConfirmation = getConfirmation,
    keyLength = 6
  } = props
  const basename = props.basename ? stripTrailingSlash(addLeadingSlash(props.basename)) : ''

  const getDOMLocation = (historyState) => {
    const { key, state } = (historyState || {})
    const { pathname, search, hash } = window.location

    let path = pathname + search + hash

    if (basename)
      path = stripPrefix(path, basename)

    return {
      ...parsePath(path),
      state,
      key
    }
  }

  const createKey = () =>
    Math.random().toString(36).substr(2, keyLength)

  const transitionManager = createTransitionManager()

  const setState = (nextState) => {
    Object.assign(history, nextState)

    history.length = globalHistory.length

    transitionManager.notifyListeners(
      history.location,
      history.action
    )
  }

  const handlePopState = (event) => {
    // Ignore extraneous popstate events in WebKit.
    if (isExtraneousPopstateEvent(event))
      return 

    handlePop(getDOMLocation(event.state))
  }

  const handleHashChange = () => {
    handlePop(getDOMLocation(getHistoryState()))
  }

  let forceNextPop = false

  const handlePop = (location) => {
    if (forceNextPop) {
      forceNextPop = false
      setState()
    } else {
      const action = 'POP'

      transitionManager.confirmTransitionTo(location, action, getUserConfirmation, (ok) => {
        if (ok) {
          setState({ action, location })
        } else {
          revertPop(location)
        }
      })
    }
  }

  const revertPop = (fromLocation) => {
    const toLocation = history.location

    // TODO: We could probably make this more reliable by
    // keeping a list of keys we've seen in sessionStorage.
    // Instead, we just default to 0 for keys we don't know.

    let toIndex = allKeys.indexOf(toLocation.key)

    if (toIndex === -1)
      toIndex = 0

    let fromIndex = allKeys.indexOf(fromLocation.key)

    if (fromIndex === -1)
      fromIndex = 0

    const delta = toIndex - fromIndex

    if (delta) {
      forceNextPop = true
      go(delta)
    }
  }

  const initialLocation = getDOMLocation(getHistoryState())
  let allKeys = [ initialLocation.key ]

  // Public interface

  const createHref = (location) =>
    basename + createPath(location)

  const push = (path, state) => {
    warning(
      !(typeof path === 'object' && path.state !== undefined && state !== undefined),
      'You should avoid providing a 2nd state argument to push when the 1st ' +
      'argument is a location-like object that already has state; it is ignored'
    )

    const action = 'PUSH'
    const location = createLocation(path, state, createKey(), history.location)

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, (ok) => {
      if (!ok)
        return

      const href = createHref(location)
      const { key, state } = location

      if (canUseHistory) {
        globalHistory.pushState({ key, state }, null, href)

        if (forceRefresh) {
          window.location.href = href
        } else {
          const prevIndex = allKeys.indexOf(history.location.key)
          const nextKeys = allKeys.slice(0, prevIndex === -1 ? 0 : prevIndex + 1)

          nextKeys.push(location.key)
          allKeys = nextKeys

          setState({ action, location })
        }
      } else {
        warning(
          state === undefined,
          'Browser history cannot push state in browsers that do not support HTML5 history'
        )

        window.location.href = href
      }
    })
  }

  const replace = (path, state) => {
    warning(
      !(typeof path === 'object' && path.state !== undefined && state !== undefined),
      'You should avoid providing a 2nd state argument to replace when the 1st ' +
      'argument is a location-like object that already has state; it is ignored'
    )

    const action = 'REPLACE'
    const location = createLocation(path, state, createKey(), history.location)

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, (ok) => {
      if (!ok)
        return

      const href = createHref(location)
      const { key, state } = location

      if (canUseHistory) {
        globalHistory.replaceState({ key, state }, null, href)

        if (forceRefresh) {
          window.location.replace(href)
        } else {
          const prevIndex = allKeys.indexOf(history.location.key)

          if (prevIndex !== -1)
            allKeys[prevIndex] = location.key

          setState({ action, location })
        }
      } else {
        warning(
          state === undefined,
          'Browser history cannot replace state in browsers that do not support HTML5 history'
        )

        window.location.replace(href)
      }
    })
  }

  const go = (n) => {
    globalHistory.go(n)
  }

  const goBack = () =>
    go(-1)

  const goForward = () =>
    go(1)

  let listenerCount = 0

  const checkDOMListeners = (delta) => {
    listenerCount += delta

    if (listenerCount === 1) {
      addEventListener(window, PopStateEvent, handlePopState)

      if (needsHashChangeListener)
        addEventListener(window, HashChangeEvent, handleHashChange)
    } else if (listenerCount === 0) {
      removeEventListener(window, PopStateEvent, handlePopState)

      if (needsHashChangeListener)
        removeEventListener(window, HashChangeEvent, handleHashChange)
    }
  }

  let isBlocked = false

  const block = (prompt = false) => {
    const unblock = transitionManager.setPrompt(prompt)

    if (!isBlocked) {
      checkDOMListeners(1)
      isBlocked = true
    }

    return () => {
      if (isBlocked) {
        isBlocked = false
        checkDOMListeners(-1)
      }

      return unblock()
    }
  }

  const listen = (listener) => {
    const unlisten = transitionManager.appendListener(listener)
    checkDOMListeners(1)

    return () => {
      checkDOMListeners(-1)
      unlisten()
    }
  }

  const history = {
    length: globalHistory.length,
    action: 'POP',
    location: initialLocation,
    createHref,
    push,
    replace,
    go,
    goBack,
    goForward,
    block,
    listen
  }

  return history
}

export default createBrowserHistory
