import createRouterHistory from './createRouterHistory'
import createHashHistory from 'history/lib/createHashHistory'

export default createRouterHistory(createHashHistory)

