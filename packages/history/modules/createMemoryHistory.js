import warning from 'warning'
import { createPath } from './PathUtils'
import { createLocation } from './LocationUtils'
import createTransitionManager from './createTransitionManager'

const clamp = (n, lowerBound, upperBound) =>
  Math.min(Math.max(n, lowerBound), upperBound)

/**
 * Creates a history object that stores locations in memory.
 */
const createMemoryHistory = (props = {}) => {
  const {
    getUserConfirmation,
    initialEntries = [ '/' ],
    initialIndex = 0,
    keyLength = 6
  } = props

  const transitionManager = createTransitionManager()

  const setState = (nextState) => {
    Object.assign(history, nextState)

    history.length = history.entries.length

    transitionManager.notifyListeners(
      history.location,
      history.action
    )
  }

  const createKey = () =>
    Math.random().toString(36).substr(2, keyLength)

  const index = clamp(initialIndex, 0, initialEntries.length - 1)
  const entries = initialEntries.map(entry => (
    typeof entry === 'string'
      ? createLocation(entry, undefined, createKey())
      : createLocation(entry, undefined, entry.key || createKey())
  ))

  // Public interface

  const createHref = createPath

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

      const prevIndex = history.index
      const nextIndex = prevIndex + 1

      const nextEntries = history.entries.slice(0)
      if (nextEntries.length > nextIndex) {
        nextEntries.splice(nextIndex, nextEntries.length - nextIndex, location)
      } else {
        nextEntries.push(location)
      }

      setState({
        action,
        location,
        index: nextIndex,
        entries: nextEntries
      })
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

      history.entries[history.index] = location

      setState({ action, location })
    })
  }

  const go = (n) => {
    const nextIndex = clamp(history.index + n, 0, history.entries.length - 1)

    const action = 'POP'
    const location = history.entries[nextIndex]

    transitionManager.confirmTransitionTo(location, action, getUserConfirmation, (ok) => {
      if (ok) {
        setState({
          action,
          location,
          index: nextIndex
        })
      } else {
        // Mimic the behavior of DOM histories by
        // causing a render after a cancelled POP.
        setState()
      }
    })
  }

  const goBack = () =>
    go(-1)

  const goForward = () =>
    go(1)

  const canGo = (n) => {
    const nextIndex = history.index + n
    return nextIndex >= 0 && nextIndex < history.entries.length
  }

  const block = (prompt = false) =>
    transitionManager.setPrompt(prompt)

  const listen = (listener) =>
    transitionManager.appendListener(listener)

  const history = {
    length: entries.length,
    action: 'POP',
    location: entries[index],
    index,
    entries,
    createHref,
    push,
    replace,
    go,
    goBack,
    goForward,
    canGo,
    block,
    listen
  }

  return history
}

export default createMemoryHistory
