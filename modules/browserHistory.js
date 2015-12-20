import createRouterHistory from './createRouterHistory'
import createBrowserHistory from 'history/lib/createBrowserHistory'

export default createRouterHistory(createBrowserHistory)
