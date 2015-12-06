import warning from 'warning'
import React from 'react'

const { object } = React.PropTypes

/**
 * The RouteContext mixin provides a convenient way for route
 * components to set the route in context. This is needed for
 * routes that render elements that want to use the Lifecycle
 * mixin to prevent transitions.
 */
const RouteContext = {

  propTypes: {
    route: object.isRequired
  },

  childContextTypes: {
    route: object.isRequired
  },

  getChildContext() {
    return {
      route: this.props.route
    }
  },

  componentWillMount() {
    warning(false, 'the `RouteContext` mixin is deprecated, please export `this.props.route` from a route component yourself. See https://github.com/rackt/react-router/blob/v1.1.0/CHANGES.md#v110 for more details.')
  }

}

export default RouteContext
