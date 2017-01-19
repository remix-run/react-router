import React, { PropTypes } from 'react'
import matchPath from './matchPath'
import { simpleResolve } from './resolve'

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      listen: PropTypes.func.isRequired,
      match: PropTypes.object
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
    const { match:parentMatch } = this.context.router

    const routes = React.Children.toArray(children)

    const parentPath = parentMatch && parentMatch.path ? parentMatch.path : ''
    let route, match
    for (let i = 0, length = routes.length; match == null && i < length; ++i) {
      route = routes[i]
      match = matchPath(
        location.pathname,
        simpleResolve(route.props.path, parentPath),
        route.props
      )
    }

    return match ? React.cloneElement(route, { computedMatch: match }) : null
  }
}

export default Switch
