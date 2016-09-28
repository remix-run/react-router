import React, { PropTypes } from 'react'
import { stringify, parse as parseQueryString } from 'query-string'
import { createRouterLocation, createRouterPath } from './LocationUtils'
import MatchProvider from './MatchProvider'
import {
  action as actionType,
  location as locationType,
  router as routerType
} from './PropTypes'

const stringifyQuery = (query) => (
  stringify(query).replace(/%20/g, '+')
)

class StaticRouter extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),

    action: actionType.isRequired,
    location: PropTypes.oneOfType([ PropTypes.object, PropTypes.string ]).isRequired,

    onPush: PropTypes.func.isRequired,
    onReplace: PropTypes.func.isRequired,
    blockTransitions: PropTypes.func,

    stringifyQuery: PropTypes.func.isRequired,
    parseQueryString: PropTypes.func.isRequired,
    createHref: PropTypes.func.isRequired, // TODO: Clarify why this is useful

    basename: PropTypes.string // TODO: Feels like we should be able to remove this
  }

  static defaultProps = {
    createHref: path => path,
    stringifyQuery,
    parseQueryString
  }

  static childContextTypes = {
    router: routerType.isRequired,
    location: locationType.isRequired // TODO: Keep state updates out of context
  }

  createLocationForContext(loc) {
    const { parseQueryString, stringifyQuery } = this.props
    return createRouterLocation(loc, parseQueryString, stringifyQuery)
  }

  getChildContext() {
    const createHref = (to) => {
      let path = createRouterPath(to, this.props.stringifyQuery)
      if (this.props.basename) path = this.props.basename + path
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
    const { location, parseQueryString, stringifyQuery } = this.props
    return createRouterLocation(location, parseQueryString, stringifyQuery)
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
