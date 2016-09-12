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
    match: PropTypes.object,
    location: PropTypes.object,
    serverRouter: PropTypes.object
  }

  state = {
    noMatchesInContext: false
  }

  componentWillMount() {
    // ignore if rendered out of context (probably for unit tests)
    if (this.context.match) {
      this.unsubscribe = this.context.match.subscribe((matchesFound) => {
        this.setState({
          noMatchesInContext: !matchesFound
        })
      })
    }
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  render() {
    const { render, component:Component } = this.props
    const { noMatchesInContext } = this.state
    const { location:locationProp } = this.props
    const location = locationProp || this.context.location
    if (noMatchesInContext) {
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
