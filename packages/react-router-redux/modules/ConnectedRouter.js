import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Router } from 'react-router'

import { LOCATION_CHANGE } from './reducer'

class ConnectedRouter extends Component {
  static propTypes = {
    store: PropTypes.object,
    history: PropTypes.object,
    children: PropTypes.node
  }

  static contextTypes = {
    store: PropTypes.object
  }

  handleLocationChange = (location, action) => {
    this.store.dispatch({
      type: LOCATION_CHANGE,
      payload: { ...location, action }
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
