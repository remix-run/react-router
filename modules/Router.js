import React from 'react'
import warning from 'warning'
import createHashHistory from 'history/lib/createHashHistory'
import { createRoutes } from './RouteUtils'
import RouterContext from './RouterContext'
import useRoutes from './useRoutes'
import { routes } from './PropTypes'
import createTransitionManager from './createTransitionManager'

function isDeprecatedHistory(history) {
  return !history || !history.__v2_compatible__
}

const { func, object } = React.PropTypes

/**
 * A <Router> is a high-level API for automatically setting up
 * a router that renders a <RouterContext> with all the props
 * it needs each time the URL changes.
 */
const Router = React.createClass({

  propTypes: {
    history: object,
    children: routes,
    routes, // alias for children
    render: func,
    createElement: func,
    onError: func,
    onUpdate: func,
    parseQueryString: func,
    stringifyQuery: func
  },

  getDefaultProps() {
    return {
      render(props) {
        return <RouterContext {...props} />
      }
    }
  },

  getInitialState() {
    return {
      location: null,
      routes: null,
      params: null,
      components: null
    }
  },

  handleError(error) {
    if (this.props.onError) {
      this.props.onError.call(this, error)
    } else {
      // Throw errors by default so we don't silently swallow them!
      throw error // This error probably occurred in getChildRoutes or getComponents.
    }
  },

  componentWillMount() {
    const { history } = this.props
    if (isDeprecatedHistory(history)) {
      this.setupDeprecatedHistory()
    } else {
      this.setupTransitionManager()
    }
  },

  setupTransitionManager() {
    const { history, routes, children } = this.props
    this.transitionManager = createTransitionManager(history, createRoutes(routes || children))
    this.transitionManager.listen((error, state) => {
      if (error) {
        this.handleError(error)
      } else {
        this.setState(state, this.props.onUpdate)
      }
    })

    this.history = {
      ...this.transitionManager,
      ...this.props.history
    }
  },

  setupDeprecatedHistory() {
    let { history, children, routes, parseQueryString, stringifyQuery } = this.props
    let createHistory = history ? () => history : createHashHistory

    this.history = useRoutes(createHistory)({
      routes: createRoutes(routes || children),
      parseQueryString,
      stringifyQuery
    })

    // polyfill transitionManager so API changes don't leak down to RouterContext
    this.transitionManager = this.history

    this._unlisten = this.history.listen((error, state) => {
      if (error) {
        this.handleError(error)
      } else {
        this.setState(state, this.props.onUpdate)
      }
    })
  },

  /* istanbul ignore next: sanity check */
  componentWillReceiveProps(nextProps) {
    warning(
      nextProps.history === this.props.history,
      'You cannot change <Router history>; it will be ignored'
    )

    warning(
      (nextProps.routes || nextProps.children) ===
        (this.props.routes || this.props.children),
      'You cannot change <Router routes>; it will be ignored'
    )
  },

  componentWillUnmount() {
    if (this._unlisten)
      this._unlisten()
  },

  render() {
    const { location, routes, params, components } = this.state
    const { createElement, render, ...props } = this.props

    if (location == null)
      return null // Async match

    // Only forward non-Router-specific props to routing context, as those are
    // the only ones that might be custom routing context props.
    Object.keys(Router.propTypes).forEach(propType => delete props[propType])

    return render({
      ...props,
      history: this.history,
      transitionManager: this.transitionManager,
      location,
      routes,
      params,
      components,
      createElement
    })
  }

})

export default Router
