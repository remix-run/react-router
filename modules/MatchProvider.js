import React, { PropTypes } from 'react'
import {
  matchContext as matchContextType
} from './PropTypes'

class MatchProvider extends React.Component {
  static childContextTypes = {
    match: matchContextType.isRequired
  }

  static contextTypes = {
    serverRouter: PropTypes.object
  }

  constructor(props) {
    super(props)
    // **IMPORTANT** we must mutate matches, never reassign, in order for
    // server rendering to work w/ the two-pass render approach for Miss
    this.matches = []
    this.subscribers = []
    this.hasMatches = null // use null for initial value
    this.serverRouterIndex = null
  }

  addMatch = match => {
    this.matches.push(match)
  }

  removeMatch = match => {
    this.matches.splice(this.matches.indexOf(match), 1)
  }

  getChildContext() {
    return {
      match: {
        addMatch: this.addMatch,
        removeMatch: this.removeMatch,
        matches: this.matches,
        parent: this.props.match,
        serverRouterIndex: this.serverRouterIndex,
        subscribe: (fn) => {
          this.subscribers.push(fn)
          return () => {
            this.subscribers.splice(this.subscribers.indexOf(fn), 1)
          }
        }
      }
    }
  }

  componentDidUpdate() {
    this.notifySubscribers()
  }

  componentWillMount() {
    const { serverRouter } = this.context
    if (serverRouter) {
      this.serverRouterIndex =
        serverRouter.registerMatchContext(this.matches)
    }
  }

  componentDidMount() {
    // React's contract is that cDM of descendants is called before cDM of
    // ancestors, so here we can safely check if we found a match
    this.notifySubscribers()
  }

  notifySubscribers() {
    if (this.subscribers.length) {
      this.hasMatches = this.matches.length !== 0
      this.subscribers.forEach(fn => fn(this.hasMatches))
    }
  }

  render() {
    return this.props.children
  }
}

if (__DEV__) {
  MatchProvider.propTypes = {
    match: PropTypes.any,
    children: PropTypes.node
  }
}

export default MatchProvider
