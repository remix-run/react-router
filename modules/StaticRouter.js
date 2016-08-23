import { stringify, parse as parseQuery } from 'query-string'
import React, { PropTypes } from 'react'
import MatchCountProvider from './MatchCountProvider'
import { createLocation } from './LocationUtils'
import { createPath } from './PathUtils'
import {
  action as actionType,
  location as locationType,
  router as routerType
} from './PropTypes'

const isPartialDescriptor = (loc) => !!loc.path


class StaticRouter extends React.Component {

  static propTypes = {
    action: actionType.isRequired,
    blockTransitions: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    createHref: PropTypes.func.isRequired,
    location: locationType.isRequired,
    onPush: PropTypes.func.isRequired,
    onReplace: PropTypes.func.isRequired,
    stringifyQuery: PropTypes.func.isRequired,
    parseQuery: PropTypes.func.isRequired
  }

  static defaultProps = {
    createHref: (loc) => {
      if (typeof loc === 'string') {
        return loc
      } else {
        return createPath(loc)
      }
    },
    stringifyQuery: (query) => stringify(query).replace(/%20/g, '+'),
    parseQuery
  }

  static childContextTypes = {
    router: routerType.isRequired,
    location: locationType.isRequired
  }

  getChildContext() {
    return {
      location: this.getLocation(),
      router: {
        createHref: (to) => this.props.createHref(to),
        transitionTo: (loc) => this.props.onPush(loc),
        replaceWith: (loc) => this.props.onReplace(loc),
        blockTransitions: (getPromptMessage) => this.blockTransitions(getPromptMessage)
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
    const { location } = this.props
    return typeof location === 'string' ? (
      this.createLocationFromPathname(location)
    ) : isPartialDescriptor(location) ? (
      this.createLocationFromLocationWithPath(location.path)
    ) : location
  }

  render() {
    const { children } = this.props
    const location = this.getLocation()

    return (
      <MatchCountProvider>
        {typeof children === 'function' ? (
          children({ location })
        ) : React.Children.count(children) > 1 ? (
          // #TODO get rid of all DOM stuff
          <div>{children}</div>
        ) : (
          children
        )}
      </MatchCountProvider>
    )
  }
}

export default StaticRouter
