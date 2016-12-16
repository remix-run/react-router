import React, { PropTypes } from 'react'
import matchRoutes from './matchRoutes'
import withHistory from './withHistory'
import {
  location as locationType
} from './PropTypes'

/**
 * The public API for rendering the first child <Route> that matches.
 */
class Router extends React.Component {
  static propTypes = {
    location: locationType.isRequired,
    children: PropTypes.node
  }

  render() {
    const { location, children } = this.props

    const routes = React.Children.map(children, child => ({
      pattern: child.props.pattern,
      exact: child.props.exact,
      element: child
    }))

    const { match, route } = matchRoutes(routes, location.pathname)

    return match ? route.element : null
  }
}

export default withHistory(Router)
