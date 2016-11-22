import React, { PropTypes } from 'react'
import { stringify, parse as parseQueryString } from 'query-string'
import Match from './Match'
import { createRouterLocation, createRouterPath, locationsAreEqual } from './LocationUtils'

const call = f => f()

const stringifyQuery = (query) => (
  stringify(query).replace(/%20/g, '+')
)

class StaticRouter extends React.Component {

  static defaultProps = {
    stringifyQuery,
    parseQueryString,
    createHref: path => path,
    onMatch: () => {}
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    // mange this ourselves instead of setState since we're notifying descendant
    // components (Match, Miss, Link) via subscriptions, if we use setState only,
    // then sCU will prevent valid changes from reconciling, if we use setState +
    // subscriptions, we get double virtual renders (`setState(nextState,
    // notifySubscribers)`), so we manage the location mutation manually.
    this.location = this.createLocation(props.location)
    this.subscribers = []
  }

  getChildContext() {
    return {
      router: this.getRouterContext()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!locationsAreEqual(nextProps.location, this.props.location)) {
      this.location = this.createLocation(nextProps.location)
      this.notifySubscribers()
    }
  }

  getRouterContext() {
    return {
      transitionTo: this.transitionTo,
      replaceWith: this.replaceWith,
      blockTransitions: this.blockTransitions,
      createHref: this.createHref,
      getState: () => ({ location: this.location }),
      onMatch: () => this.props.onMatch(),
      subscribe: (fn) => {
        this.subscribers.push(fn)
        return () => {
          this.subscribers.splice(this.subscribers.indexOf(fn), 1)
        }
      }
    }
  }

  createLocation(location) {
    const { parseQueryString, stringifyQuery } = this.props
    return createRouterLocation(location, parseQueryString, stringifyQuery)
  }

  transitionTo = (location) => {
    this.props.onPush(this.createLocation(location))
  }

  replaceWith = (location) => {
    this.props.onReplace(this.createLocation(location))
  }

  blockTransitions = (prompt) => this.props.blockTransitions(prompt)

  createHref = (to) => {
    let path = createRouterPath(to, this.props.stringifyQuery)

    if (this.props.basename)
      if (path === '/')
        path = this.props.basename
      else if (path.length >= 2 && path.charAt(0) === '/' && path.charAt(1) === '?')
        path = this.props.basename + path.substring(1)
      else
        path = this.props.basename + path

    return this.props.createHref(path)
  }

  notifySubscribers = () => {
    if (this.subscribers.length)
      this.subscribers.forEach(call)
  }

  render() {
    const { location } = this
    const { children, action } = this.props
    return (
      <Match pattern="/">
        {() => (
          typeof children === 'function' ? (
            children({ action, location, router: this.getRouterContext() })
          ) : (
            React.Children.only(children)
          )
        )}
      </Match>
    )
  }
}

if (__DEV__) {
  StaticRouter.propTypes = {
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),

    history: PropTypes.object,

    location: PropTypes.oneOfType([ PropTypes.object, PropTypes.string ]).isRequired,
    action: PropTypes.string.isRequired,

    onPush: PropTypes.func.isRequired,
    onReplace: PropTypes.func.isRequired,
    onMatch: PropTypes.func.isRequired,
    blockTransitions: PropTypes.func,

    stringifyQuery: PropTypes.func.isRequired,
    parseQueryString: PropTypes.func.isRequired,
    createHref: PropTypes.func.isRequired,

    basename: PropTypes.string
  }
}

export default StaticRouter
