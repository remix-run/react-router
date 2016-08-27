import React, { PropTypes } from 'react'
import { location as locationType } from './PropTypes'

class Miss extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    location: locationType,
    render: PropTypes.func,
    component: PropTypes.func
  }

  static contextTypes = {
    matchCounter: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  render() {
    const { render, component:Component } = this.props
    const { matchCounter } = this.context
    const { location:locationProp } = this.props
    const location = locationProp || this.context.location
    if (!matchCounter) {
      // don't render if out of context (probably a unit test)
      return null
    } else {
      return matchCounter.matchFound() ? null : (
        render ? (
          render({ location })
        ) : (
          <Component location={location}/>
        )
      )
    }
  }
}

export default Miss
