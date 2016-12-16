import React from 'react'
import {
  history as historyType
} from './PropTypes'

/**
 * Private higher-order component API for setting up the lifecycle
 * methods on context.history and getting action/location as props.
 */
const withHistory = (component) => {
  return class extends React.Component {
    static displayName = `withHistory(${component.displayName})`

    static contextTypes = {
      history: historyType.isRequired
    }

    static childContextTypes = {
      history: historyType.isRequired
    }

    getChildContext() {
      this.childContextHistory = {
        ...this.context.history,
        ...this.state, // overwrite action/location
        listen: this.listen
      }

      return {
        history: this.childContextHistory
      }
    }

    listen = (listener) => {
      this.listeners.push(listener)

      return () => {
        this.listeners = this.listeners.filter(item => item !== listener)
      }
    }

    update = (state) => {
      this.setState(state)

      // Immediately update childContextHistory so that any
      // new descendants can get the correct action/location
      // in componentWillMount.
      Object.assign(this.childContextHistory, state)

      // Notify descendants who have registered for updates.
      this.listeners.forEach(listener => {
        listener(state.location, state.action)
      })
    }

    state = {
      action: null,
      location: null
    }

    componentWillMount() {
      this.listeners = []

      const { action, location } = this.context.history

      this.setState({ action, location })
    }

    componentDidMount() {
      const { history } = this.context

      this.unlisten = history.listen((location, action) => {
        this.nextState = { action, location }

        if (this.child.handleRouteChange) {
          const nextState = this.nextState

          this.child.handleRouteChange(nextState, () => {
            // Check to make sure the state hasn't changed
            // since we first invoked handleRouteChange.
            if (nextState === this.nextState)
              this.update(this.nextState)
          })
        } else {
          this.update(this.nextState)
        }
      })
    }

    componentWillUnmount() {
      this.unlisten()
    }

    updateChild = (child) => {
      this.child = child
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        ...this.state,
        ref: this.updateChild,
        history: this.context.history
      })
    }
  }
}

export default withHistory
