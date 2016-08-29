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
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    serverRouter: PropTypes.object
  }

  render() {
    const { render, component:Component } = this.props
    const { match, serverRouter } = this.context
    const { location:locationProp } = this.props
    const location = locationProp || this.context.location
    if (!match) {
      // don't render if out of context (probably a unit test)
      return null
    } else if (!match.matchFound()) {
      // side-effect in render, only happens on the server
      // and calling it multiple times should be fine
      if (serverRouter)
        serverRouter.onMiss(location)
      return (
        render ? (
          render({ location })
        ) : (
          <Component location={location}/>
        )
      )
    } else {
      return null
    }
  }
}

export default Miss
