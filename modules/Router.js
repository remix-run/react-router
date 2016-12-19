import React, { PropTypes } from 'react'
import matchPattern from './matchPattern'
import withHistory from './withHistory'
import {
  location as locationType
} from './PropTypes'

/**
 * The public API for rendering the first child <Route> that matches.
 */
const Router = (props) => {
  const { location, children } = props

  const routes = React.Children.map(children, child => ({
    path: child.props.path,
    exact: child.props.exact,
    element: child
  }))

  let match, route
  for (let i = 0, length = routes.length; match == null && i < length; ++i) {
    route = routes[i]
    match = matchPattern(route.path, route.exact, location.pathname)
  }

  return match ? route.element : null
}

Router.propTypes = {
  location: locationType.isRequired,
  children: PropTypes.node
}

export default withHistory(Router)
