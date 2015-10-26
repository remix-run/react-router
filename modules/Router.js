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

  static propTypes = {
    history: object,
    children: routes,
    routes, // alias for children
    createElement: func,
    onError: func,
    onUpdate: func,
    parseQueryString: func,
    stringifyQuery: func
  }

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
    let { history, children, routes, parseQueryString, stringifyQuery } = this.props
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
        this.setState(state, this.props.onUpdate)
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
    let { createElement } = this.props

    if (location == null)
      return null // Async match

    return React.createElement(RoutingContext, {
      history: this.history,
      createElement,
      location,
      routes,
      params,
      components
    })
  }

}

export default Router
