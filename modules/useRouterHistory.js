import useQueries from 'history/lib/useQueries'
import useBasename from 'history/lib/useBasename'

export default function useRouterHistory(createHistory) {
  return function (options) {
    const history = useQueries(useBasename(createHistory))(options)
    return history
  }
}
