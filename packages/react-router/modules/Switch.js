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
      '<Switch> elements should not change from controlled to uncontrolled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    )

    warning(
      !(!nextProps.location && this.props.location),
      '<Switch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    )
  }

  componentWillUnmount() {
    if (this.unlisten)
      this.unlisten()
  }

  render() {
    const { children } = this.props
    const { location } = this.state

    let match, child
    React.Children.forEach(children, element => {
      if (match == null) {
        child = element
        match = matchPath(location.pathname, element.props)
      }
    })

    return match ? React.cloneElement(child, { computedMatch: match }) : null
  }
}

export default Switch
