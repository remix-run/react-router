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
    if (this.child.routeWillChange) {
      this.child.routeWillChange.call(this.child, nextState, callback)
    } else {
      callback()
    }
  }

  updateChild = (child) => {
    this.child = child
  }

  render() {
    const { action, location, pattern, exact, component, render, ...props } = this.props

    const renderMatch = (props, matched) => (
      render ? (
        render({ ...props, matched })
      ) : (
        matched ? React.createElement(component, props) : null
      )
    )

    const routes = [{
      pattern,
      exact,
      render: props => renderMatch(props, true)
    }, {
      render: props => renderMatch(props, false)
    }]

    const { match, route } = matchRoutes(routes, location.pathname)

    if (!match)
      return null

    return route.render({
      ...props,
      ...match,
      route,
      action,
      location,
      ref: this.updateChild
    })
  }
}

export default withHistory(Route)
