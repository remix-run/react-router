import React, { Component, PropTypes } from 'react'
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

  handleLocationChange = location => {
    /*
     * Update the store in 2 cases:
     * 1) Not syncing history to match store (normal flow from history to store).
     * 2) DevTools resets state to empty location (need to change to an initial
     * location).
    */
    if (!this.isSyncingHistory || !this.store.getState().router.location.pathname) {
      this.store.dispatch({
        type: LOCATION_CHANGE,
        payload: location
      })
    }
    // Stop syncing the history.
    this.isSyncingHistory = false
  }

  handleStoreChange = () => {
    // Extract store's location.
    const storeLocation = this.store.getState().router.location
    const {
      pathname: storePathname,
      search: storeSearch,
      hash: storeHash,
    } = storeLocation
    // Extract history's location.
    const {
      pathname: historyPathname,
      search: historySearch,
      hash: historyHash,
    } = this.props.history.location

    // In normal situation, the store receives location state from the history.
    // When the store is updated, the location in the store will be in sync with
    // the location in the history. However, if the location in the store is
    // updated before the history, they will be different. We might be time
    // travelling, replacing root reducer, importing state, etc. So, we need to
    // update the history to sync with the store.
    if (historyPathname !== storePathname
      || historySearch !== storeSearch
      || historyHash !== storeHash) {
      // start syncing the history
      this.isSyncingHistory = true

      if (!storePathname) {
        // Use initial location if the store is reset.
        // Store will be updated to initial location in handleLocationChange.
        this.props.history.push(this.initialLocation)
      } else {
        this.props.history.push(storeLocation)
      }
    }
  }

  componentWillMount() {
    const { store:propsStore, history } = this.props
    this.store = propsStore || this.context.store
    this.isSyncingHistory = false
    this.initialLocation = history.location

    this.unsubscribeFromHistory = history.listen(this.handleLocationChange)
    this.handleLocationChange(history.location)
    this.unsubscribeFromStore = this.store.subscribe(this.handleStoreChange)
  }

  componentWillUnmount() {
    if (this.unsubscribeFromHistory) this.unsubscribeFromHistory()
    if (this.unsubscribeFromStore) this.unsubscribeFromStore()
  }

  render() {
    return <Router {...this.props} />
  }
}

export default ConnectedRouter
