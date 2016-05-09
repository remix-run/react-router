import { PropTypes } from 'react'

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

export function ContextProvider(name) {
  const contextName = makeContextName(name)
  const listenersKey = `${contextName}/listeners`
  const eventIndexKey = `${contextName}/eventIndex`
  const subscribeKey = `${contextName}/subscribe`

  return {
    childContextTypes: {
      [contextName]: contextProviderShape.isRequired
    },

    getChildContext() {
      return {
        [contextName]: {
          eventIndex: this[eventIndexKey],
          subscribe: this[subscribeKey]
        }
      }
    },

    componentWillMount() {
      this[listenersKey] = []
      this[eventIndexKey] = 0
    },

    componentWillReceiveProps() {
      this[eventIndexKey]++
    },

    componentDidUpdate() {
      this[listenersKey].forEach(listener =>
        listener(this[eventIndexKey])
      )
    },

    [subscribeKey](listener) {
      // No need to immediately call listener here.
      this[listenersKey].push(listener)

      return () => {
        this[listenersKey] = this[listenersKey].filter(item =>
          item !== listener
        )
      }
    }
  }
}

export function ContextSubscriber(name) {
  const contextName = makeContextName(name)
  const lastRenderedEventIndexKey = `${contextName}/lastRenderedEventIndex`
  const handleContextUpdateKey = `${contextName}/handleContextUpdate`
  const unsubscribeKey = `${contextName}/unsubscribe`

  return {
    contextTypes: {
      [contextName]: contextProviderShape
    },

    getInitialState() {
      if (!this.context[contextName]) {
        return {}
      }

      return {
        [lastRenderedEventIndexKey]: this.context[contextName].eventIndex
      }
    },

    componentDidMount() {
      if (!this.context[contextName]) {
        return
      }

      this[unsubscribeKey] = this.context[contextName].subscribe(
        this[handleContextUpdateKey]
      )
    },

    componentWillReceiveProps() {
      if (!this.context[contextName]) {
        return
      }

      this.setState({
        [lastRenderedEventIndexKey]: this.context[contextName].eventIndex
      })
    },

    componentWillUnmount() {
      if (!this[unsubscribeKey]) {
        return
      }

      this[unsubscribeKey]()
      this[unsubscribeKey] = null
    },

    [handleContextUpdateKey](eventIndex) {
      if (eventIndex !== this.state[lastRenderedEventIndexKey]) {
        this.setState({ [lastRenderedEventIndexKey]: eventIndex })
      }
    }
  }
}
