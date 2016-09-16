import React, { PropTypes } from 'react'
import { stringify, parse as parseQueryString } from 'query-string'
import { createRouterLocation, createRouterPath } from './LocationUtils'
import MatchProvider from './MatchProvider'
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
    location: PropTypes.oneOfType([ PropTypes.object, PropTypes.string ]).isRequired,
    onPush: PropTypes.func.isRequired,
    onReplace: PropTypes.func.isRequired,
    stringifyQuery: PropTypes.func.isRequired,
    // TODO: parseQueryString
    parseQuery: PropTypes.func.isRequired
  }

  static defaultProps = {
    createHref: path => path,
    stringifyQuery: defaultStringifyQuery,
    parseQuery: parseQueryString
  }

  static childContextTypes = {
    router: routerType.isRequired,
    location: locationType.isRequired
  }

  createLocationForContext(loc) {
    const { parseQuery, stringifyQuery } = this.props
    return createRouterLocation(loc, parseQuery, stringifyQuery)
  }

  getChildContext() {
    const createHref = (to) => {
      const path = createRouterPath(to, this.props.stringifyQuery)
      return this.props.createHref(path)
    }

    const location = this.getLocation()

    return {
      location,
      router: {
        createHref,
        transitionTo: (loc) => {
          this.props.onPush(this.createLocationForContext(loc))
        },
        replaceWith: (loc) => {
          this.props.onReplace(this.createLocationForContext(loc))
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
        ) : (
          React.Children.only(children)
        )}
      </MatchProvider>
    )
  }
}

export default StaticRouter
