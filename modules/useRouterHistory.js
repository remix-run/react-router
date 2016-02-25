import useQueries from 'history/lib/useQueries'
import useBasename from 'history/lib/useBasename'
import useBeforeUnload from 'history/lib/useBeforeUnload'

export default function useRouterHistory(createHistory) {
  return function (options) {
    const history = useBeforeUnload(useQueries(useBasename(createHistory)))(options)
    history.__v2_compatible__ = true
    return history
  }
}
