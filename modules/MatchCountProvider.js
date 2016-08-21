import React, { PropTypes } from 'react'
import {
  counter as counterType
} from './PropTypes'

class MatchCountProvider extends React.Component {
  static propTypes = {
    match: PropTypes.any,
    children: PropTypes.node
  }

  static childContextTypes = {
    matchCounter: counterType.isRequired
  }

  state = { count: 0 }
  count = 0

  increment = () => {
    // have to manage manually since we're calling `increment` in `willMount` of
    // descendants and React doesn't intentionally support that.
    this.count += 1
  }

  decrement = () => {
    this.count -= 1
  }

  getChildContext() {
    return {
      matchCounter: {
        increment: this.increment,
        decrement: this.decrement,
        matchFound: () => this.count > 0
      }
    }
  }

  render() {
    return this.props.children
  }
}

export default MatchCountProvider
