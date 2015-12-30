import useRouterHistory from './useRouterHistory'
import createHashHistory from 'history/lib/createHashHistory'

export default useRouterHistory(createHashHistory)()

