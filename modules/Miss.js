import React, { PropTypes } from 'react'
import { location as locationType } from './PropTypes'

class Miss extends React.Component {
  static contextTypes = {
    provider: PropTypes.object,
    location: PropTypes.object,
    serverRouter: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)

    // ignore if rendered out of context (probably for unit tests)
    if (context.provider && !context.serverRouter) {
      this.unsubscribe = this.context.provider.addMiss((matchesFound) => {
        this.setState({
          noMatchesInContext: !matchesFound
        })
      })
    }

    if (context.serverRouter) {
      context.serverRouter.registerMissPresence(
        context.provider.serverRouterIndex
      )
    }

    this.state = {
      noMatchesInContext: false
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
    const location = this.props.location || this.context.location
    const { serverRouter, provider } = this.context
    const noMatchesOnServerContext = serverRouter &&
      serverRouter.missedAtIndex(provider.serverRouterIndex)
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
