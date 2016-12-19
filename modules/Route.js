import React, { PropTypes } from 'react'
import matchPattern from './matchPattern'
import withHistory from './withHistory'
import {
  action as actionType,
  location as locationType
} from './PropTypes'

/**
 * The public API for matching a single path.
 */
class Route extends React.Component {
  static propTypes = {
    action: actionType.isRequired,
    location: locationType.isRequired,
    path: PropTypes.string,
    exact: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func
  }

  static defaultProps = {
    exact: false
  }

  handleRouteChange({ action, location }, callback) {
    const child = this.child

    // Need to check for existence of child because
    // functional components don't have instances.
    if (child && typeof child.routeWillChange === 'function') {
      const { path, exact } = this.props
      const match = matchPattern(path, exact, location.pathname)

      // Compute the next props the component will
      // receive so it has access to params, etc.
      const props = {
        action,
        location,
        params: (match ? match.params : {}),
        match
      }

      child.routeWillChange.call(child, props, callback)
    } else {
      callback()
    }
  }

  updateChild = (child) => {
    this.child = child
  }

  render() {
    const { action, location, path, exact, component, render } = this.props
    const match = matchPattern(path, exact, location.pathname)

    const props = {
      action,
      location,
      params: (match ? match.params : {}),
      match
    }

    const ref = this.updateChild

    return (
      render ? (
        React.cloneElement(render(props), { ref })
      ) : (
        match ? React.createElement(component, { ...props, ref }) : null
      )
    )
  }
}

export default withHistory(Route)
