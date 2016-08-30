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
      parent: props.match,
      matches: []
    }
  }

  addMatch = match => {
    const { matches } = this.state

    this.setState({
      matches: matches.concat([match])
    })
  }

  removeMatch = match => {
    const { matches } = this.state

    this.setState({
      matches: matches.splice(matches.indexOf(match), 1)
    })
  }

  getChildContext() {
    return {
      match: {
        addMatch: this.addMatch,
        removeMatch: this.removeMatch,

        parent: this.state.parent,
        matches: this.state.matches,

        matchFound: () => this.state.matches.length > 0
      }
    }
  }

  render() {
    return this.props.children
  }
}

export default MatchProvider
