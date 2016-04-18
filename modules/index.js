/* components */
export Router from './Router'
export Link from './Link'
export IndexLink from './IndexLink'

/* components (configuration) */
export IndexRedirect from './IndexRedirect'
export IndexRoute from './IndexRoute'
export Redirect from './Redirect'
export Route from './Route'

/* utils */
export { createRoutes } from './RouteUtils'
export RouterContext from './RouterContext'
export RoutingContext from './RoutingContext'
export PropTypes, { locationShape, routerShape } from './PropTypes'
export match from './match'
export useRouterHistory from './useRouterHistory'
export { formatPattern } from './PatternUtils'
export applyRouterMiddleware from './applyRouterMiddleware'

/* histories */
export browserHistory from './browserHistory'
export hashHistory from './hashHistory'
export createMemoryHistory from './createMemoryHistory'
