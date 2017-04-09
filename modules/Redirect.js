import React from 'react'
import createReactClass from 'create-react-class'
import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'
import { formatPattern } from './PatternUtils'
import { falsy } from './InternalPropTypes'

const { string, object } = React.PropTypes

/**
 * A <Redirect> is used to declare another URL path a client should
 * be sent to when they request a given URL.
 *
 * Redirects are placed alongside routes in the route configuration
 * and are traversed in the same manner.
 */
/* eslint-disable react/require-render-return */
const Redirect = createReactClass({

  statics: {

    createRouteFromReactElement(element) {
      const route = createRouteFromReactElement(element)

      if (route.from)
        route.path = route.from

      route.onEnter = function (nextState, replace) {
        const { location, params } = nextState

        let pathname
        if (route.to.charAt(0) === '/') {
          pathname = formatPattern(route.to, params)
        } else if (!route.to) {
          pathname = location.pathname
        } else {
          let routeIndex = nextState.routes.indexOf(route)
          let parentPattern = Redirect.getRoutePattern(nextState.routes, routeIndex - 1)
          let pattern = parentPattern.replace(/\/*$/, '/') + route.to
          pathname = formatPattern(pattern, params)
        }

        replace({
          pathname,
          query: route.query || location.query,
          state: route.state || location.state
        })
      }

      return route
    },

    getRoutePattern(routes, routeIndex) {
      let parentPattern = ''

      for (let i = routeIndex; i >= 0; i--) {
        const route = routes[i]
        const pattern = route.path || ''

        parentPattern = pattern.replace(/\/*$/, '/') + parentPattern

        if (pattern.indexOf('/') === 0)
          break
      }

      return '/' + parentPattern
    }

  },

  propTypes: {
    path: string,
    from: string, // Alias for path
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: falsy,
    children: falsy
  },

  /* istanbul ignore next: sanity check */
  render() {
    invariant(
      false,
      '<Redirect> elements are for router configuration only and should not be rendered'
    )
  }

})

export default Redirect
