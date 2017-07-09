import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Router } from 'react-router'

import { LOCATION_CHANGE } from './reducer'

class ConnectedRouter extends Component {
  static propTypes = {
    store: PropTypes.object,
    history: PropTypes.object,
    children: PropTypes.node,
    isServer: PropTypes.bool
  }

  static contextTypes = {
    store: PropTypes.object
  }

  static childContextTypes = {
    router: PropTypes.shape({
      staticContext: PropTypes.object
    })
  }

  getChildContext() {
    return this.props.isServer ? {
      router: {
        staticContext: {}
      }
    } : undefined
  }

  handleLocationChange = location => {
    this.store.dispatch({
      type: LOCATION_CHANGE,
      payload: location
    })
  }

  componentWillMount() {
    const { store:propsStore, history } = this.props
    this.store = propsStore || this.context.store
    this.handleLocationChange(history.location)
  }

  componentDidMount() {
    const { history } = this.props
    this.unsubscribeFromHistory = history.listen(this.handleLocationChange)
  }

  componentWillUnmount() {
    if (this.unsubscribeFromHistory) this.unsubscribeFromHistory()
  }

  render() {
    return <Router {...this.props} />
  }
}

export default ConnectedRouter
