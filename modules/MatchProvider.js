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

    this.state = {
      parent: props.match
    }

    // When accessing state along this.context, it appears any enqueued setState
    // calls don't get dispatched on the server (renderToString) and something
    // like Miss will never work. This works around that by using a simple
    // instance variable. Sorry it's not idiomatic React!
    this.matches = []
  }

  addMatch = match => {
    this.matches = this.matches.concat([match])
  }

  removeMatch = match => {
    this.matches = this.matches.splice(this.matches.indexOf(match), 1)
  }

  getChildContext() {
    return {
      match: {
        addMatch: this.addMatch,
        removeMatch: this.removeMatch,

        parent: this.state.parent,
        matches: this.matches,

        matchFound: () => this.matches.length > 0
      }
    }
  }

  render() {
    return this.props.children
  }
}

export default MatchProvider
