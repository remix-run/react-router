import { setWindowScrollPosition } from './DOMUtils'

export default function useScrollToTopBehavior(createHistory) {
  return function (options) {
    const history = createHistory(options)

    history.listen(() => {
      // Need to defer this to after other listeners fire in case some of them
      // update the page.
      setTimeout(() => setWindowScrollPosition(0, 0))
    })

    return history
  }
}
