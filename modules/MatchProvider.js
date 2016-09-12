import React, { PropTypes } from 'react'
import {
  matchContext as matchContextType
} from './PropTypes'

class MatchProvider extends React.Component {
  static propTypes = {
    match: PropTypes.any,
    children: PropTypes.node
  }

  static childContextTypes = {
    match: matchContextType.isRequired
  }

  constructor(props) {
    super(props)
    this.parent = props.match
    // React doesn't support a parent calling `setState` from an descendant's
    // componentWillMount, so we use an instance property to track matches
    this.matches = []
    this.subscribers = []
    this.hasMatches = null // use null for initial value
  }

  addMatch = match => {
    this.matches = this.matches.concat([match])
  }

  removeMatch = match => {
    this.matches.splice(this.matches.indexOf(match), 1)
  }

  getChildContext() {
    return {
      match: {
        addMatch: this.addMatch,
        removeMatch: this.removeMatch,

        parent: this.parent,
        matches: this.matches,

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

  componentDidMount() {
    this.notifySubscribers()
  }

  notifySubscribers() {
    // React's contract is that cDM of descendants is called before cDM of
    // ancestors, so here we can safely check if we found a match
    if (this.subscribers.length) {
      const hadMatches = this.hasMatches
      this.hasMatches = this.matches.length !== 0
      // optimization, don't notify if nothing changed initial will be null, so
      // we can get initial render correct
      if (this.hasMatches !== hadMatches) {
        this.subscribers.forEach(fn => fn(this.hasMatches))
      }
    }
  }

  render() {
    return this.props.children
  }
}

export default MatchProvider
