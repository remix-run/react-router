import React, { PropTypes } from 'react'
import matchRoutes from './matchRoutes'
import withHistory from './withHistory'
import Route from './Route'
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

    const routes = []

    React.Children.forEach(children, child => {
      if (child.type === Route) {
        routes.push({
          pattern: child.props.pattern,
          exact: child.props.exact,
          element: child
        })
      }
    })

    // This covers the case when someone renders e.g. a <BrowserRouter>
    // just to get the right context w/out actually passing any <Route>s
    // as children. In that case, we just render the children.
    if (routes.length === 0)
      return React.Children.only(children)

    const { match, route } = matchRoutes(routes, location.pathname)

    return match ? route.element : null
  }
}

export default withHistory(Router)
