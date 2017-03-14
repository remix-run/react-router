import invariant from 'invariant'
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

  componentWillMount() {
    const { children } = this.props

    invariant(
      children == null || React.Children.count(children) === 1,
      'A <ConnectedRouter> may have only one child element'
    )
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

            return children ? React.Children.only(children) : null
          }}/>
      </Router>
    )
  }
}

export default ConnectedRouter
