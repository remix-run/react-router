import React, { PropTypes } from 'react'
import warning from 'warning'
import matchPath from './matchPath'

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    history: PropTypes.object.isRequired
  }

  static propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  }

  state = {
    location: this.props.location || this.context.history.location
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Switch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    )

    warning(
      !(!nextProps.location && this.props.location),
      '<Switch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    )

    this.setState({
      location: nextProps.location || this.context.history.location
    })
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
