import React, { PropTypes } from 'react'

class MatchCountProvider extends React.Component {
  static propTypes = {
    isTerminal: PropTypes.bool,
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
    this.setState({
      count: this.count
    })
  }

  unregisterMatch = () => {
    this.count -= 1
    this.setState({
      count: this.count
    })
  }

  getChildContext() {
    return {
      matchCounter: {
        matchFound: this.props.isTerminal || this.state.count > 0,
        registerMatch: this.registerMatch,
        unregisterMatch: this.unregisterMatch
      }
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

export default MatchCountProvider
