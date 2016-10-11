import React, { PropTypes } from 'react'
import { location as locationType } from './PropTypes'

class Miss extends React.Component {
  static contextTypes = {
    match: PropTypes.object,
    location: PropTypes.object,
    serverRouter: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      noMatchesInContext: false
    }

    if (context.serverRouter) {
      context.serverRouter.registerMissPresence(
        context.match.serverRouterIndex
      )
    }
  }

  componentWillMount() {
    const { match, serverRouter } = this.context

    // ignore if rendered out of context (probably for unit tests)
    if (match && !serverRouter) {
      this.unsubscribe = match.subscribe((matchesFound) => {
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
    const { serverRouter, match } = this.context
    const noMatchesOnServerContext = serverRouter &&
      serverRouter.missedAtIndex(match.serverRouterIndex)
    if (noMatchesInContext || noMatchesOnServerContext) {
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

if (__DEV__) {
  Miss.propTypes = {
    children: PropTypes.node,
    location: locationType,
    render: PropTypes.func,
    component: PropTypes.func
  }
}

export default Miss
