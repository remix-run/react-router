import invariant from 'invariant'
import React, { Component } from 'react'
import { isReactChildren } from './RouteUtils'
import getRouteParams from './getRouteParams'

const { array, func, object } = React.PropTypes

/**
 * A <RoutingContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */
class RoutingContext extends Component {

  static propTypes = {
    history: object.isRequired,
    createElement: func.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired
  }

  static defaultProps = {
    createElement: React.createElement
  }

  static childContextTypes = {
    history: object.isRequired,
    location: object.isRequired,
    params: object.isRequired
  }

  getChildContext() {
    const { history, location, params } = this.props
    return { history, location, params }
  }

  createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props)
  }

  render() {
    const { history, location, routes, params, components } = this.props
    let element = null

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element // Don't create new children; use the grandchildren.

        const route = routes[index]
        const routeParams = getRouteParams(route, params)
        const props = {
          history,
          location,
          params,
          route,
          routeParams,
          routes
        }

        if (isReactChildren(element)) {
          props.children = element
        } else if (element) {
          for (let prop in element)
            if (element.hasOwnProperty(prop))
              props[prop] = element[prop]
        }

        if (typeof components === 'object') {
          const elements = {}

          for (let key in components)
            if (components.hasOwnProperty(key))
              elements[key] = this.createElement(components[key], props)

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

}

export default RoutingContext
