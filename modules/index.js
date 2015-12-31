/*eslint no-console: 0*/
console.log('[react-router]', 'Thanks for trying the 2.0 beta! Please disable the React Devtools browser extension. It accesses deprecated properties and will cause deprecation warnings to be logged even when you have properly updated your code. If any part of your upgrade isn\'t smooth, please open an issue or pull request to help us make it better for the next person. :thumbsup:')

/* components */
export Router from './Router'
export Link from './Link'
export IndexLink from './IndexLink'

/* components (configuration) */
export IndexRedirect from './IndexRedirect'
export IndexRoute from './IndexRoute'
export Redirect from './Redirect'
export Route from './Route'

/* mixins */
export History from './History'
export Lifecycle from './Lifecycle'
export RouteContext from './RouteContext'

/* utils */
export useRoutes from './useRoutes'
export { createRoutes } from './RouteUtils'
export RouterContext from './RouterContext'
export PropTypes from './PropTypes'
export match from './match'
export useRouterHistory from './useRouterHistory'

/* histories */
export browserHistory from './browserHistory'
export hashHistory from './hashHistory'
export createMemoryHistory from './createMemoryHistory'

export default from './Router'
