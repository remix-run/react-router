import React, { PropTypes } from 'react'

// Works around issues with context updates failing to propagate.
// https://github.com/facebook/react/issues/2517
// https://github.com/reactjs/react-router/issues/470

const contextProviderShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  eventIndex: PropTypes.number.isRequired
})

function makeContextName(name) {
  return `@@contextSubscriber/${name}`
}

export function createContextProvider(name) {
  const contextName = makeContextName(name)

  const ContextProvider = React.createClass({
    propTypes: {
      children: PropTypes.node.isRequired
    },

    childContextTypes: {
      [contextName]: contextProviderShape.isRequired
    },

    getChildContext() {
      return {
        [contextName]: {
          subscribe: this.subscribe,
          eventIndex: this.eventIndex
        }
      }
    },

    componentWillMount() {
      this.eventIndex = 0
      this.listeners = []
    },

    componentWillReceiveProps() {
      this.eventIndex++
    },

    componentDidUpdate() {
      this.listeners.forEach(listener => listener(this.eventIndex))
    },

    subscribe(listener) {
      // No need to immediately call listener here.
      this.listeners.push(listener)

      return () => {
        this.listeners = this.listeners.filter(item => item !== listener)
      }
    },

    render() {
      return this.props.children
    }
  })

  return ContextProvider
}

export function connectToContext(WrappedComponent, name) {
  const contextName = makeContextName(name)

  const ContextSubscriber = React.createClass({
    contextTypes: {
      [contextName]: contextProviderShape
    },

    getInitialState() {
      if (!this.context[contextName]) {
        return {}
      }

      return {
        lastRenderedEventIndex: this.context[contextName].eventIndex
      }
    },

    componentDidMount() {
      if (!this.context[contextName]) {
        return
      }

      this.unsubscribe = this.context[contextName].subscribe(
        this.handleContextUpdate
      )
    },

    componentWillReceiveProps() {
      if (!this.context[contextName]) {
        return
      }

      this.setState({
        lastRenderedEventIndex: this.context[contextName].eventIndex
      })
    },

    componentWillUnmount() {
      if (!this.unsubscribe) {
        return
      }

      this.unsubscribe()
      this.unsubscribe = null
    },

    handleContextUpdate(eventIndex) {
      if (eventIndex !== this.state.lastRenderedEventIndex) {
        this.setState({ lastRenderedEventIndex: eventIndex })
      }
    },

    render() {
      return <WrappedComponent {...this.props} />
    }
  })

  return ContextSubscriber
}
