import React, { Component } from 'react'
import warning from 'warning'
import { history } from './PropTypes'

/**
 * A higher-order-component that passes "history" as a property to components.
 */

function connectHistory(WrappedComponent) {
  class ConnectHistory extends Component {
    render() {
      warning(
        this.props.history == null,
        'The passed prop "history" will be overwritten by connectHistory()'
      )
      return <WrappedComponent {...this.props} history={this.context.history} />
    }
  }

  ConnectHistory.contextTypes = { history }
  ConnectHistory.displayName = `ConnectHistory(${getDisplayName(WrappedComponent)})`
  ConnectHistory.WrappedComponent = WrappedComponent

  return ConnectHistory
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default connectHistory
