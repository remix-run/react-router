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
    // React doesn't support a parent calling `setState` from an ancestor's
    // componentWillMount, so we use an instance property to track matches
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

        parent: this.parent,
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
