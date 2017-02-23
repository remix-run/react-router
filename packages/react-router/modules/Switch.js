import React, { PropTypes } from 'react'
import warning from 'warning'
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
    children: PropTypes.node,
    location: PropTypes.object
  }

  state = {
    location: this.props.location || this.context.router.location
  }

  componentWillMount() {
    if (!this.props.location) {
      const { router } = this.context

      // Start listening here so we can <Redirect> on the initial render.
      this.unlisten = router.listen(() => {
        this.setState({
          location: router.location
        })
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      'You cannot change from an uncontrolled to controlled Switch. You passed in a `location` prop on a re-render when initially there was none.'
    )
    warning(
      !(!nextProps.location && this.props.location),
      'You cannot change from a controlled to an uncontrolled Switch. You passed in a `location` prop initially but on a re-render there was none.'
    )
  }

  componentWillUnmount() {
    if (this.unlisten)
      this.unlisten()
  }

  render() {
    const { children:routes } = this.props
    const { location } = this.state

    let route, match
    for (let i = 0, length = routes.length; match == null && i < length; ++i) {
      route = routes[i]
      match = matchPath(location.pathname, route.props)
    }

    return match ? React.cloneElement(route, { computedMatch: match }) : null
  }
}

export default Switch
