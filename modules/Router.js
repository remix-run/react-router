import warning from 'warning'
import React, { Component } from 'react'
import createHashHistory from 'history/lib/createHashHistory'
import { createRoutes } from './RouteUtils'
import RoutingContext from './RoutingContext'
import useRoutes from './useRoutes'
import { routes } from './PropTypes'

const { func, object } = React.PropTypes

/**
 * A <Router> is a high-level API for automatically setting up
 * a router that renders a <RoutingContext> with all the props
 * it needs each time the URL changes.
 */
class Router extends Component {

  constructor(props, context) {
    super(props, context)

    this.state = {
      location: null,
      routes: null,
      params: null,
      components: null
    }
  }

  handleError(error) {
    if (this.props.onError) {
      this.props.onError.call(this, error)
    } else {
      // Throw errors by default so we don't silently swallow them!
      throw error // This error probably occurred in getChildRoutes or getComponents.
    }
  }

  componentWillMount() {
    let { history, children, routes, onUpdate, parseQueryString, stringifyQuery } = this.props
    let createHistory = history ? () => history : createHashHistory

    this.history = useRoutes(createHistory)({
      routes: createRoutes(routes || children),
      parseQueryString,
      stringifyQuery
    })

    this._unlisten = this.history.listen((error, state) => {
      if (error) {
        this.handleError(error)
      } else {
        this.setState(state, () => onUpdate && onUpdate.call(this, state))
      }
    })
  }

  /* istanbul ignore next: sanity check */
  componentWillReceiveProps(nextProps) {
    warning(
      nextProps.history === this.props.history,
      'You cannot change <Router history>; it will be ignored'
    )
  }

  componentWillUnmount() {
    if (this._unlisten)
      this._unlisten()
  }

  render() {
    let { location, routes, params, components } = this.state
    let { RoutingContext, createElement, ...props } = this.props

    if (location == null)
      return null // Async match

    // Only forward non-Router-specific props to routing context, as those are
    // the only ones that might be custom routing context props.
    Object.keys(Router.propTypes).forEach(propType => delete props[propType])

    return React.createElement(RoutingContext, {
      ...props,
      history: this.history,
      createElement,
      location,
      routes,
      params,
      components
    })
  }

}

Router.propTypes = {
  history: object,
  children: routes,
  routes, // alias for children
  RoutingContext: func.isRequired,
  createElement: func,
  onError: func,
  onUpdate: func,
  parseQueryString: func,
  stringifyQuery: func
}

Router.defaultProps = {
  RoutingContext
}

export default Router
