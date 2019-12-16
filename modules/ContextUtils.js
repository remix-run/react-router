/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

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
