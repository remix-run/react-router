import { readState, saveState } from 'history/lib/DOMStateStorage'
import { addEventListener, getWindowScrollPosition, setWindowScrollPosition }
  from './DOMUtils'

export default function useStandardScrollBehavior(createHistory) {
  return function (options) {
    const history = createHistory(options)

    let currentLocation
    let savePositionHandle = null

    addEventListener(window, 'scroll', () => {
      if (savePositionHandle !== null) {
        clearTimeout(savePositionHandle)
      }

      savePositionHandle = setTimeout(() => {
        savePositionHandle = null

        if (!currentLocation) {
          return
        }
        const { key } = currentLocation

        const state = readState(key)
        saveState(key, {
          ...state, scrollPosition: getWindowScrollPosition()
        })
      })
    })

    history.listenBefore(() => {
      if (savePositionHandle !== null) {
        clearTimeout(savePositionHandle)
        savePositionHandle = null
      }
    })

    function getScrollPosition() {
      const state = readState(currentLocation.key)
      if (!state) {
        return null
      }

      return state.scrollPosition
    }

    history.listen(location => {
      currentLocation = location

      const scrollPosition = getScrollPosition() || {}
      const { x = 0, y = 0 } = scrollPosition

      // Need to defer the scroll operation because this listener fires before
      // e.g. the router updates its state, and this might need to scroll past
      // the end of the page pre-transition if the popped page was longer.
      setTimeout(() => setWindowScrollPosition(x, y))
    })

    return history
  }
}
