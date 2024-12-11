// This is a fork from @types/react-router@3.0.28
// Type definitions for . 3.0
// Project: https://github.com/rackt/.
// Definitions by: Sergey Buturlakin <https://github.com/sergey-buturlakin>
//                 Yuichi Murata <https://github.com/mrk21>
//                 Václav Ostrožlík <https://github.com/vasek17>
//                 Nathan Brown <https://github.com/ngbrown>
//                 Alex Wendland <https://github.com/awendland>
//                 Kostya Esmukov <https://github.com/KostyaEsmukov>
//                 John Reilly <https://github.com/johnnyreilly>
//                 Karol Janyst <https://github.com/LKay>
//                 Dovydas Navickas <https://github.com/DovydasNavickas>
//                 Ross Allen <https://github.com/ssorallen>
//                 Christian Gill <https://github.com/gillchristian>
//                 Roman Nevolin <https://github.com/nulladdict>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 3.5

export {
  ChangeHook,
  EnterHook,
  InjectedRouter,
  LeaveHook,
  ParseQueryString,
  RouteComponent,
  RouteComponents,
  RouteComponentProps,
  RouteConfig,
  RoutePattern,
  RouterProps,
  RouterState,
  RedirectFunction,
  StringifyQuery
} from './lib/Router'
export { LinkProps } from './lib/Link'
export { IndexLinkProps } from './lib/IndexLink'
export { RouteProps, PlainRoute } from './lib/Route'
export { IndexRouteProps } from './lib/IndexRoute'
export { RedirectProps } from './lib/Redirect'
export { IndexRedirectProps } from './lib/IndexRedirect'
export { WithRouterProps } from './lib/withRouter'

/* components */
export { default as Router } from './lib/Router'
export { default as Link } from './lib/Link'
export { default as IndexLink } from './lib/IndexLink'
export { default as withRouter } from './lib/withRouter'

/* components (configuration) */
export { default as IndexRedirect } from './lib/IndexRedirect'
export { default as IndexRoute } from './lib/IndexRoute'
export { default as Redirect } from './lib/Redirect'
export { default as Route } from './lib/Route'

/* utils */
export { createRoutes } from './lib/RouteUtils'
export { default as RouterContext } from './lib/RouterContext'
export { routerShape, locationShape } from './lib/PropTypes'
export {
  default as match,
  MatchHistoryArgs,
  MatchLocationArgs,
  MatchCallback
} from './lib/match'
export { default as useRouterHistory } from './lib/useRouterHistory'
export { formatPattern } from './lib/PatternUtils'
export { default as applyRouterMiddleware } from './lib/applyRouterMiddleware'

/* histories */
export { default as browserHistory } from './lib/browserHistory'
export { default as hashHistory } from './lib/hashHistory'
export { default as createMemoryHistory } from './lib/createMemoryHistory'
