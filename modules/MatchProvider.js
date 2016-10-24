import React, { PropTypes } from 'react'
import {
  providerContext as providerContextType
} from './PropTypes'

class MatchProvider extends React.Component {
  static childContextTypes = {
    provider: providerContextType.isRequired,
    location: PropTypes.object.isRequired
  }

  static contextTypes = {
    serverRouter: PropTypes.object
  }

  constructor(props) {
    super(props)
    // **IMPORTANT** we must mutate matches, never reassign, in order for
    // server rendering to work w/ the two-pass render approach for Miss
    this.matches = []
    this.misses = []

    this.serverRouterIndex = null
  }

  addMatch = fn => {
    this.matches.push(fn)
    return () => {
      this.matches.splice(this.matches.indexOf(fn), 1)
    }
  }

  addMiss = fn => {
    this.misses.push(fn)
    return () => {
      this.misses.splice(this.misses.indexOf(fn), 1)
    }
  }

  getChildContext() {
    return {
      provider: {
        addMatch: this.addMatch,
        addMiss: this.addMiss,
        matches: this.matches,
        parent: this.props.match,
        serverRouterIndex: this.serverRouterIndex
      },
      location: this.props.location
    }
  }

  componentDidUpdate() {
    this.notifySubscribers()
  }

  componentWillMount() {
    const { serverRouter } = this.context
    if (serverRouter) {
      this.serverRouterIndex =
        serverRouter.registerMatchProvider(this.matches)
    }
  }

  componentDidMount() {
    this.notifySubscribers()
  }

  notifySubscribers() {
    const { location } = this.props
    const hasMatches = this.matches
      .map(fn => fn(location))
      .some(matches => matches)
    this.misses.forEach(fn => fn(hasMatches))
  }

  render() {
    return this.props.children
  }
}

if (__DEV__) {
  MatchProvider.propTypes = {
    match: PropTypes.any,
    children: PropTypes.node,
    location: PropTypes.object
  }
}

export default MatchProvider
