import { stringify, parse as parseQuery } from 'query-string'
import React, { PropTypes } from 'react'
import MatchProvider from './MatchProvider'
import createLocation from './createLocation'
import { createPath } from 'react-history/PathUtils'
import {
  action as actionType,
  location as locationType,
  router as routerType
} from './PropTypes'

const isPartialDescriptor = (loc) => !!loc.path

const defaultStringifyQuery = (query) => (
  stringify(query).replace(/%20/g, '+')
)

const createPathWithQuery = (loc, stringifyQuery) => {
  if (typeof loc === 'string') {
    return loc
  } else {
    const location = { ...loc }
    if (loc.query)
      location.search = `?${stringifyQuery(loc.query)}`
    return createPath(location)
  }
}

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
      const path = createPathWithQuery(to, this.props.stringifyQuery)
      return this.props.createHref(path)
    }

    // TODO: move this into a HistoryRouter so the StaticRouter
    // API is just locations, not the history API's signatures
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

  createLocationFromPathname() {
    const { location:pathname, parseQuery } = this.props
    return {
      ...createLocation({ input: pathname, parseQuery }),
      state: null
    }
  }

  createLocationFromLocationWithPath() {
    const { location:loc, parseQuery } = this.props
    return {
      ...createLocation({ input: loc.path, parseQuery }),
      state: loc.state || null
    }
  }

  getLocation() {
    // TODO: maybe memoize this on willReceiveProps to get extreme w/ perf
    const { location, parseQuery } = this.props
    return typeof location === 'string' ? (
      this.createLocationFromPathname(location)
    ) : isPartialDescriptor(location) ? (
      this.createLocationFromLocationWithPath(location.path)
    ) : createLocation({ input: location, parseQuery })
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
