import createRouter from './Router'
import createLink from './Link'
import createIndexLink from './IndexLink'
import createIndexRoute from './IndexRoute'
import createRedirect from './Redirect';
import createRoute from './Route'
import createHistory from './History'
import createLifecycle from './Lifecycle'
import createRouteContext from './RouteContext'
import createUseRoutes from './useRoutes'
import createRouteUtils from './RouteUtils'
import createRoutingContext from './RoutingContext'
import createPropTypes from './PropTypes'
import createMatch from './match'


export default function createAll(React) {
  const Router = createRouter(React)
  const Link = createLink(React)
  const IndexLink = createIndexLink(React)
  const IndexRoute = createIndexRoute(React)
  const Redirect = createRedirect(React)
  const Route = createRoute(React)
  const History = createHistory(React)
  const Lifecycle = createLifecycle(React)
  const RouteContext = createRouteContext(React)
  const useRoutes = createUseRoutes(React)
  const { createRoutes } = createRouteUtils(React)
  const RoutingContext = createRoutingContext(React)
  const PropTypes = createPropTypes(React)
  const match = createMatch(React)

  return {
    /* components */
    Router,
    Link,
    IndexLink,
    /* components (configuration) */
    IndexRoute,
    Redirect,
    Route,
    /* mixins */
    History,
    Lifecycle,
    RouteContext,

    /* utils */
    useRoutes,
    createRoutes,
    RoutingContext,
    PropTypes,
    match
  }
}
