import { setWindowScrollPosition } from './DOMUtils'

export default function useScrollToTopBehavior(createHistory) {
  return function (options) {
    const history = createHistory(options)

    history.listen(function (location) {
      if (location.action === 'POP') {
        return
      }

      setWindowScrollPosition(0, 0)
    })

    return history
  }
}
