import React, { PropTypes } from 'react'
import matchPattern from './matchPattern'
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

    let match, route
    for (let i = 0, length = routes.length; match == null && i < length; ++i) {
      route = routes[i]
      match = matchPattern(route.pattern, route.exact, location.pathname)
    }

    return match ? route.element : null
  }
}

export default withHistory(Router)
