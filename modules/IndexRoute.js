import React from 'react'
import invariant from 'invariant'
import warning from 'warning'
import { createRouteFromReactElement } from './RouteUtils'
import { component, components, falsy } from './PropTypes'

const { bool, func } = React.PropTypes

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */
class IndexRoute extends React.Component {

  static createRouteFromReactElement(element, parentRoute) {
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
    ignoreScrollBehavior: bool,
    component,
    components,
    getComponents: func
  }

  render() {
    invariant(
      false,
      '<IndexRoute> elements are for router configuration only and should not be rendered'
    )
  }

}

export default IndexRoute
