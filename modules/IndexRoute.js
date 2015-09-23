import invariant from 'invariant'
import warning from 'warning'
import createRouteUtils from './RouteUtils'
import createPropTypes from './PropTypes'

export default function createIndexRoute(React) {
  const { createRouteFromReactElement } = createRouteUtils(React)
  const { component, components, falsy } = createPropTypes(React)

  const { bool, func } = React.PropTypes

  /**
   * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
   * a JSX route config.
   */
  const IndexRoute = React.createClass({

    statics: {

      createRouteFromReactElement(element, parentRoute) {
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
      ignoreScrollBehavior: bool,
      component,
      components,
      getComponents: func
    },

    render() {
      invariant(
        false,
        '<IndexRoute> elements are for router configuration only and should not be rendered'
      )
    }

  })

  return IndexRoute

}
