import { stringify, parse as parseQuery } from 'query-string'
import React, { PropTypes } from 'react'
import MatchProvider from './MatchProvider'
import { createRouterLocation, createRouterPath } from './LocationUtils'
import {
  action as actionType,
  location as locationType,
  router as routerType
} from './PropTypes'

const defaultStringifyQuery = (query) => (
  stringify(query).replace(/%20/g, '+')
)

class StaticRouter extends React.Component {

  static propTypes = {
    action: actionType.isRequired,
    blockTransitions: PropTypes.func,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    createHref: PropTypes.func.isRequired,
    location: PropTypes.oneOfType([ locationType, PropTypes.string ]).isRequired,
    onPush: PropTypes.func.isRequired,
    onReplace: PropTypes.func.isRequired,
    stringifyQuery: PropTypes.func.isRequired,
    // TODO: parseQueryString
    parseQuery: PropTypes.func.isRequired
  }

  static defaultProps = {
    createHref: path => path,
    stringifyQuery: defaultStringifyQuery,
    parseQuery
  }

  static childContextTypes = {
    router: routerType.isRequired,
    location: locationType.isRequired
  }

  getChildContext() {
    const createHref = (to) => {
      const path = createRouterPath(to, this.props.stringifyQuery)
      return this.props.createHref(path)
    }

    const getPathAndState = (loc) => {
      const path = createHref(loc)
      const state = typeof loc === 'object' ? loc.state : null
      return { path, state }
    }

    const location = this.getLocation()

    return {
      location,
      router: {
        createHref,
        transitionTo: (loc) => {
          const { path, state } = getPathAndState(loc)
          this.props.onPush(path, state)
        },
        replaceWith: (loc) => {
          const { path, state } = getPathAndState(loc)
          this.props.onReplace(path, state)
        },
        blockTransitions: (getPromptMessage) => {
          this.props.blockTransitions(getPromptMessage)
        }
      }
    }
  }

  getLocation() {
    // TODO: maybe memoize this on willReceiveProps to get extreme w/ perf
    const { location, parseQuery, stringifyQuery } = this.props
    return createRouterLocation(location, parseQuery, stringifyQuery)
  }

  render() {
    const { children } = this.props
    const location = this.getLocation()

    return (
      <MatchProvider>
        {typeof children === 'function' ? (
          children({ location, router: this.getChildContext().router })
        ) : React.Children.count(children) > 1 ? (
          // #TODO get rid of all DOM stuff
          <div>{children}</div>
        ) : (
          children
        )}
      </MatchProvider>
    )
  }
}

export default StaticRouter
