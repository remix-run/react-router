import React, { PropTypes } from 'react'
import {
  action as actionType,
  historyLocation as historyLocationType,
  historyContext as historyContextType
} from './PropTypes'

/**
 * The common public API for all *History components.
 */
class HistoryContext extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    action: actionType.isRequired,
    location: historyLocationType.isRequired,
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
    go: PropTypes.func.isRequired
  }

  static childContextTypes = {
    history: historyContextType.isRequired
  }

  getChildContext() {
    return {
      history: {
        push: this.props.push,
        replace: this.props.replace,
        go: this.props.go
      }
    }
  }

  render() {
    return this.props.children(this.props.location, this.props.action)
  }
}

export default HistoryContext
