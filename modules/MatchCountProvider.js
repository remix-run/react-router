import React, { PropTypes } from 'react'

class MatchCountProvider extends React.Component {
  static propTypes = {
    match: PropTypes.any,
    children: PropTypes.node
  }

  static childContextTypes = {
    matchCounter: PropTypes.object
  }

  state = { count: 0 }
  count = 0

  registerMatch = () => {
    // have to manage manually since calling setState on same tick of event loop
    // would result in only `1` even though many may have registered
    this.count += 1
    this.forceUpdate()
  }

  unregisterMatch = () => {
    this.count -= 1
    this.forceUpdate()
  }

  getChildContext() {
    return {
      matchCounter: {
        matchFound: this.count > 0,
        registerMatch: this.registerMatch,
        unregisterMatch: this.unregisterMatch
      }
    }
  }

  render() {
    return this.props.children
  }
}

export default MatchCountProvider
