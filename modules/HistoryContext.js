import React, { PropTypes } from 'react'
import {
  historyLocation as historyLocationType,
  historyContext as historyContextType
} from './PropTypes'

/**
 * The common public API for all *History components.
 */
class HistoryContext extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    location: historyLocationType.isRequired,
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
    pop: PropTypes.func.isRequired
  }

  static childContextTypes = {
    history: historyContextType.isRequired
  }

  getChildContext() {
    return {
      history: {
        push: this.props.push,
        replace: this.props.replace,
        pop: this.props.pop
      }
    }
  }

  render() {
    return this.props.children(this.props.location)
  }
}

export default HistoryContext
