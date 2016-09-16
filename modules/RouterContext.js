import invariant from 'invariant'
import React from 'react'

import getRouteParams from './getRouteParams'
import { ContextProvider } from './ContextUtils'
import { isReactChildren } from './RouteUtils'

const { array, func, object } = React.PropTypes

/**
 * A <RouterContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */
const RouterContext = React.createClass({

  mixins: [ ContextProvider('router') ],

  propTypes: {
    router: object.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired,
    createElement: func.isRequired
  },

  getDefaultProps() {
    return {
      createElement: React.createElement
    }
  },

  childContextTypes: {
    router: object.isRequired
  },

  getChildContext() {
    return {
      router: this.props.router
    }
  },

  createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props)
  },

  render() {
    const { location, routes, params, components, router } = this.props
    let element = null

    if (components) {
      element = components.reduceRight((element, components, index) => {
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

        if (typeof components === 'object') {
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

    return element
  }

})

export default RouterContext
