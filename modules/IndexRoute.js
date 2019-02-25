import { Component } from 'react'
import { func } from 'prop-types'
import warning from './routerWarning'
import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'
import { component, components, falsy } from './InternalPropTypes'

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */
/* eslint-disable react/require-render-return */
class IndexRoute extends Component {
  static displayName = 'IndexRoute'

  static createRouteFromReactElement(element, parentRoute) {
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

  static propTypes = {
    path: falsy,
    component,
    components,
    getComponent: func,
    getComponents: func
  }

  /* istanbul ignore next: sanity check */
  render() {
    invariant(
      false,
      '<IndexRoute> elements are for router configuration only and should not be rendered'
    )
  }
}

export default IndexRoute
