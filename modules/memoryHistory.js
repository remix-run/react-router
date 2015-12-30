import useRouterHistory from './useRouterHistory'
import createMemoryHistory from 'history/lib/createMemoryHistory'

export default useRouterHistory(createMemoryHistory)()
