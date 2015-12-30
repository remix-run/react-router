import useRouterHistory from './useRouterHistory'
import createBrowserHistory from 'history/lib/createBrowserHistory'

export default useRouterHistory(createBrowserHistory)()
