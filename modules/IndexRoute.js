import warning from './routerWarning'
import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */
/* eslint-disable react/require-render-return */
function IndexRoute() {
  /* istanbul ignore next: sanity check */
  invariant(
    false,
    '<IndexRoute> elements are for router configuration only and should not be rendered'
  )
}

IndexRoute.createRouteFromReactElement = (element, parentRoute) => {
  /* istanbul ignore else: sanity check */
  if (parentRoute) {
    parentRoute.indexRoute = createRouteFromReactElement(element)
  } else {
    warning(
      false,
      'An <IndexRoute> does not make sense at the root of your route config'
    )
  }
}

export default IndexRoute
