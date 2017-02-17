import React, { PropTypes } from 'react'
import matchPath from './matchPath'

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      listen: PropTypes.func.isRequired
    }).isRequired
  }

  static propTypes = {
    children: PropTypes.node
  }

  state = {
    location: null
  }

  componentWillMount() {
    const { router } = this.context

    this.setState({ 
      location: router.location
    })

    // Start listening here so we can <Redirect> on the initial render.
    this.unlisten = router.listen(() => {
      this.setState({
        location: router.location
      })
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { children } = this.props
    const { location } = this.state
    const routes = React.Children.toArray(children)

    let route, match
    for (let i = 0, length = routes.length; match == null && i < length; ++i) {
      route = routes[i]
      match = matchPath(location.pathname, route.props)
    }

    return match ? React.cloneElement(route, { computedMatch: match }) : null
  }
}

export default Switch
