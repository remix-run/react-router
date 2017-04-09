import React from 'react'
import createReactClass from 'create-react-class'
import warning from './routerWarning'
import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'
import { component, components, falsy } from './InternalPropTypes'

const { func } = React.PropTypes

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */
/* eslint-disable react/require-render-return */
const IndexRoute = createReactClass({

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
