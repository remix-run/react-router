import React, { Component, PropTypes } from 'react'
import { Router, Route } from 'react-router'

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

  render() {
    const { store:propsStore, history, children, ...props } = this.props
    let store = propsStore || this.context.store

    return (
      <Router {...props} history={history}>
        <Route render={({ location }) => {
            store.dispatch({
              type: LOCATION_CHANGE,
              payload: location
            })

            return children
          }}/>
      </Router>
    )
  }
}

export default ConnectedRouter
