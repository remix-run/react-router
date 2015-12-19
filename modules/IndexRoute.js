import React from 'react'
import warning from './warning'
import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'
import { component, components, falsy } from './PropTypes'

const { func } = React.PropTypes

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */
const IndexRoute = React.createClass({

  statics: {

    createRouteFromReactElement(element, parentRoute) {
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

  },

  propTypes: {
    path: falsy,
    component,
    components,
    getComponent: func,
    getComponents: func
  },

  /* istanbul ignore next: sanity check */
  render() {
    invariant(
      false,
      '<IndexRoute> elements are for router configuration only and should not be rendered'
    )
  }
  
})

export default IndexRoute
