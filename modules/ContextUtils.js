import React, { Component } from 'react'

// Works around issues with context updates failing to propagate.
// Caveat: the context value is expected to never change its identity.
// https://github.com/facebook/react/issues/2517
// https://github.com/reactjs/react-router/issues/470

export function makeContextName(name) {
  return `@@contextSubscriber/${name}`
}

export const RouterContext = React.createContext({})

const contextName = makeContextName('router')

// subscriber keys
const lastRenderedEventIndexKey = `${contextName}/lastRenderedEventIndex`
const handleContextUpdateKey = `${contextName}/handleContextUpdate`
const unsubscribeKey = `${contextName}/unsubscribe`

function contextHOC(Subscriber) {
  return class WrappedSubscriber extends Component {
    static contextType = RouterContext

    render() {
      const newProps = { ...this.props, context: this.context }
      return <Subscriber {...newProps} />
    }
  }
}

class ContextSubscriberBase extends Component {
  constructor(props, context) {
    super(props)

    const initialState = {}

    if(context[contextName]) {
      initialState[lastRenderedEventIndexKey] = context[contextName].eventIndex
    }

    this.state = initialState
  }

  static getDerivedStateFromProps(props) {
    if (!props.context[contextName]) {
      return
    }

    return {
      [lastRenderedEventIndexKey]: props.context[contextName].eventIndex
    }
  }

  componentDidMount() {
    if (!this.context[contextName]) {
      return
    }

    this[unsubscribeKey] = this.context[contextName].subscribe(
      this[handleContextUpdateKey]
    )
  }

  componentWillUnmount() {
    if (!this[unsubscribeKey]) {
      return
    }

    this[unsubscribeKey]()
    this[unsubscribeKey] = null
  }

  [handleContextUpdateKey] = (eventIndex) => {
    if (eventIndex !== this.state[lastRenderedEventIndexKey]) {
      this.setState({ [lastRenderedEventIndexKey]: eventIndex })
    }
  }
}

export const ContextSubscriber = contextHOC(ContextSubscriberBase)
