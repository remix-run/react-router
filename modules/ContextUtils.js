import React, { PropTypes } from 'react'

// Works around issues with context updates failing to propagate.
// https://github.com/facebook/react/issues/2517
// https://github.com/reactjs/react-router/issues/470

export function createContextProvider(name, contextType = PropTypes.any) {
  const ContextProvider = React.createClass({
    propTypes: {
      children: PropTypes.node.isRequired
    },

    contextTypes: {
      [name]: contextType
    },

    childContextTypes: {
      [name]: contextType
    },

    getChildContext() {
      return {
        [name]: {
          ...this.context[name],
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

export function connectToContext(WrappedComponent, name, contextType = PropTypes.any) {
  const ContextSubscriber = React.createClass({
    contextTypes: {
      [name]: contextType
    },

    getInitialState() {
      if (!this.context[name]) {
        return {}
      }

      return {
        lastRenderedEventIndex: this.context[name].eventIndex
      }
    },

    componentDidMount() {
      if (!this.context[name]) {
        return
      }

      this.unsubscribe = this.context[name].listen(eventIndex => {
        if (eventIndex !== this.state.lastRenderedEventIndex) {
          this.setState({ lastRenderedEventIndex: eventIndex })
        }
      })
    },

    componentWillReceiveProps() {
      if (!this.context[name]) {
        return
      }

      this.setState({
        lastRenderedEventIndex: this.context[name].eventIndex
      })
    },

    componentWillUnmount() {
      if (!this.unsubscribe) {
        return
      }

      this.unsubscribe()
      this.unsubscribe = null
    },

    render() {
      return <WrappedComponent {...this.props} />
    }
  })

  return ContextSubscriber
}
