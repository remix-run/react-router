import createHashHistory from 'history/lib/createHashHistory'
import useQueries from 'history/lib/useQueries'
import React from 'react'

import createTransitionManager from './createTransitionManager'
import { routes } from './PropTypes'
import RouterContext from './RouterContext'
import { createRoutes } from './RouteUtils'
import { createRouterObject, createRoutingHistory } from './RouterUtils'
import warning from './warning'

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
    onUpdate: func
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
    let { history } = this.props
    const { routes, children } = this.props

    const { parseQueryString, stringifyQuery } = this.props
    warning(
      !(parseQueryString || stringifyQuery),
      '`parseQueryString` and `stringifyQuery` are deprecated. Please create a custom history. http://tiny.cc/router-customquerystring'
    )

    if (isDeprecatedHistory(history)) {
      history = this.wrapDeprecatedHistory(history)
    }

    const transitionManager = createTransitionManager(
      history, createRoutes(routes || children)
    )
    this._unlisten = transitionManager.listen((error, state) => {
      if (error) {
        this.handleError(error)
      } else {
        this.setState(state, this.props.onUpdate)
      }
    })

    this.router = createRouterObject(history, transitionManager)
    this.history = createRoutingHistory(history, transitionManager)
  },

  wrapDeprecatedHistory(history) {
    const { parseQueryString, stringifyQuery } = this.props

    let createHistory
    if (history) {
      warning(false, 'It appears you have provided a deprecated history object to `<Router/>`, please use a history provided by ' +
                     'React Router with `import { browserHistory } from \'react-router\'` or `import { hashHistory } from \'react-router\'`. ' +
                     'If you are using a valid custom history please set `history.__v2_compatible__ = true`. http://tiny.cc/router-usinghistory')
      createHistory = () => history
    } else {
      warning(false, '`Router` no longer defaults the history prop to hash history. Please use the `hashHistory` singleton instead. http://tiny.cc/router-defaulthistory')
      createHistory = createHashHistory
    }

    return useQueries(createHistory)({ parseQueryString, stringifyQuery })
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
      router: this.router,
      location,
      routes,
      params,
      components,
      createElement
    })
  }

})

export default Router
