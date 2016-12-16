import React, { PropTypes } from 'react'
import matchRoutes from './matchRoutes'
import withHistory from './withHistory'
import {
  action as actionType,
  location as locationType
} from './PropTypes'

/**
 * The public API for matching a single pattern.
 */
class Route extends React.Component {
  static propTypes = {
    action: actionType.isRequired,
    location: locationType.isRequired,
    pattern: PropTypes.string.isRequired,
    exact: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func
  }

  static defaultProps = {
    exact: false
  }

  handleRouteChange(nextState, callback) {
    const child = this.child

    if (typeof child.routeWillChange === 'function') {
      const { action, location, pattern, exact, component, render, ...props } = this.props // eslint-disable-line no-unused-vars
      const { match } = matchRoutes([ { pattern, exact } ], nextState.location.pathname)

      // Compute the next props the component will
      // receive so it has access to params, etc.
      const nextChildProps = {
        ...props,
        ...match,
        action: nextState.action,
        location: nextState.location,
        matched: match != null
      }

      child.routeWillChange.call(child, nextChildProps, callback)
    } else {
      callback()
    }
  }

  updateChild = (child) => {
    this.child = child
  }

  render() {
    const { action, location, pattern, exact, component, render, ...props } = this.props
    const { match } = matchRoutes([ { pattern, exact } ], location.pathname)
    const matched = match != null

    const childProps = {
      ...props,
      ...match,
      action,
      location,
      matched,
      ref: this.updateChild
    }

    return (
      render ? (
        render(childProps)
      ) : (
        matched ? React.createElement(component, childProps) : null
      )
    )
  }
}

export default withHistory(Route)
