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

import invariant from 'invariant'
import React, { Component } from 'react'
import { array, func, object } from 'prop-types'

import getRouteParams from './getRouteParams'
import { isReactChildren } from './RouteUtils'

const createNamedContext = (name) => {
  const context = React.createContext({})
  context.displayName = name
  return context
}

export const Context = createNamedContext('@@OneAppRouterContext')

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
      <Context.Provider
        value={{ router: this.props.router }}
      >
        {element}
      </Context.Provider>
    )
  }
}

export default RouterContext
