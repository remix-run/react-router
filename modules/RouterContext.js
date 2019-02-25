import invariant from 'invariant'
import React, { Component } from 'react'
import { array, func, object } from 'prop-types'

import getRouteParams from './getRouteParams'
import { RouterContext as ProvidableRouterContext, makeContextName } from './ContextUtils'
import { isReactChildren } from './RouteUtils'

const contextName = makeContextName('router')
const listenersKey = `${contextName}/listeners`
const eventIndexKey = `${contextName}/eventIndex`
const subscribeKey = `${contextName}/subscribe`

/**
 * A <RouterContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */
class RouterContext extends Component {
  static displayName = 'RouterContext'

  static propTypes = {
    router: object.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired,
    createElement: func.isRequired
  }

  static defaultProps = {
    createElement: React.createElement
  }

  UNSAFE_componentWillMount() {
    this[listenersKey] = []
    this[eventIndexKey] = 0
  }

  UNSAFE_componentWillReceiveProps() {
    this[eventIndexKey]++
  }

  componentDidUpdate() {
    this[listenersKey].forEach(listener =>
      listener(this[eventIndexKey])
    )
  }

  [subscribeKey] = (listener) => {
    // No need to immediately call listener here.
    this[listenersKey].push(listener)

    return () => {
      this[listenersKey] = this[listenersKey].filter(item =>
        item !== listener
      )
    }
  }

  createElement = (component, props) => {
    return component == null ? null : this.props.createElement(component, props)
  }

  render() {
    const { location, routes, params, components, router } = this.props
    let element = null

    if (components) {
      element = components.reduceRight((element, components, index) => {
        // TODO: remove variable shadowing, element, components ....
        if (components == null)
          return element // Don't create new children; use the grandchildren.

        const route = routes[index]
        const routeParams = getRouteParams(route, params)
        const props = {
          location,
          params,
          route,
          router,
          routeParams,
          routes
        }

        if (isReactChildren(element)) {
          props.children = element
        } else if (element) {
          for (const prop in element)
            if (Object.prototype.hasOwnProperty.call(element, prop))
              props[prop] = element[prop]
        }

        if (typeof components === 'object' && !components.$$typeof) {
          const elements = {}

          for (const key in components) {
            if (Object.prototype.hasOwnProperty.call(components, key)) {
              // Pass through the key as a prop to createElement to allow
              // custom createElement functions to know which named component
              // they're rendering, for e.g. matching up to fetched data.
              elements[key] = this.createElement(components[key], {
                key, ...props
              })
            }
          }

          return elements
        }

        return this.createElement(components, props)
      }, element)
    }

    invariant(
      element === null || element === false || React.isValidElement(element),
      'The root route must render a single element'
    )

    return (
      <ProvidableRouterContext.Provider
        value={{
          router: this.props.router,
          [contextName]: {
            eventIndex: this[eventIndexKey],
            subscribe: this[subscribeKey]
          }
        }}
      >
        {element}
      </ProvidableRouterContext.Provider>
    )
  }
}

export default RouterContext
