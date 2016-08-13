import warning from 'warning'
import React, { PropTypes } from 'react'
import HistoryContext from './HistoryContext'
import {
  action as actionType
} from './PropTypes'

/**
 * A <HistoryContext> for DOM histories.
 */
class DOMHistoryContext extends React.Component {
  static propTypes = {
    action: actionType.isRequired,
    go: PropTypes.func.isRequired
  }

  handleConfirm = (message, callback) =>
    callback(window.confirm(message)) // eslint-disable-line no-alert

  handleRevert = () => {
    const { action, go } = this.props

    if (action === 'PUSH') {
      go(-1)
    } else if (action === 'REPLACE') {
      warning(
        false,
        '<DOMHistoryContext> cannot revert a REPLACE'
      )
    } else {
      // TODO: Need to track keys in order to revert a POP.
    }
  }

  render() {
    return (
      <HistoryContext
        {...this.props}
        confirm={this.handleConfirm}
        revert={this.handleRevert}
      />
    )
  }
}

export default DOMHistoryContext
