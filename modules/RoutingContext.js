import React from 'react'
import invariant from 'invariant'
import getRouteParams from './getRouteParams'

var { array, func, object } = React.PropTypes

/**
 * A <RoutingContext> renders the component tree for a given router state
 * and sets the history object and the current location in context.
 */
var RoutingContext = React.createClass({

  propTypes: {
    history: object.isRequired,
    createElement: func.isRequired,
    location: object.isRequired,
    routes: array.isRequired,
    params: object.isRequired,
    components: array.isRequired
  },

  getDefaultProps() {
    return {
      createElement: React.createElement
    }
  },

  childContextTypes: {
    history: object.isRequired,
    location: object.isRequired
  },

  getChildContext() {
    return {
      history: this.props.history,
      location: this.props.location
    }
  },

  createElement(component, props) {
    return component == null ? null : this.props.createElement(component, props)
  },

  render() {
    var { history, location, routes, params, components } = this.props
    var element = null

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element // Don't create new children use the grandchildren.

        var route = routes[index]
        var routeParams = getRouteParams(route, params)
        var props = {
          history,
          location,
          params,
          route,
          routeParams,
          routes
        }

        if (element)
          props.children = element

        if (typeof components === 'object') {
          var elements = {}

          for (var key in components)
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

})

export default RoutingContext
