import React, { PropTypes } from 'react'
import { stringify, parse as parseQueryString } from 'query-string'
import MatchProvider from './MatchProvider'
import { LocationEmitter } from './locationEmission'
import {
  locationsAreEqual,
  createRouterLocation,
  createRouterPath
} from './LocationUtils'
import {
  action as actionType,
  routerContext as routerContextType
} from './PropTypes'

const stringifyQuery = (query) => (
  stringify(query).replace(/%20/g, '+')
)

class StaticRouter extends React.Component {
  static defaultProps = {
    stringifyQuery,
    parseQueryString,
    createHref: path => path
  }

  static childContextTypes = {
    router: routerContextType.isRequired
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

  blockTransitions = (prompt) => {
    this.props.blockTransitions(prompt)
  }

  createHref = (to) => {
    let path = createRouterPath(to, this.props.stringifyQuery)

    if (this.props.basename)
      path = this.props.basename + path

    return this.props.createHref(path)
  }

  getRouterContext() {
    return {
      transitionTo: this.transitionTo,
      replaceWith: this.replaceWith,
      blockTransitions: this.blockTransitions,
      createHref: this.createHref
    }
  }

  getChildContext() {
    return {
      router: this.getRouterContext()
    }
  }

  state = {
    location: null
  }

  componentWillMount() {
    this.setState({
      location: this.createLocation(this.props.location)
    })
  }

  componentWillReceiveProps(nextProps) {
    const nextLocation = this.createLocation(nextProps.location)

    if (!locationsAreEqual(this.state.location, nextLocation))
      this.setState({ location: nextLocation })
  }

  render() {
    const { location } = this.state
    const { action, children } = this.props

    return (
      <LocationEmitter value={location}>
        <MatchProvider>
          {typeof children === 'function' ? (
            children({ action, location, router: this.getRouterContext() })
          ) : (
            React.Children.only(children)
          )}
        </MatchProvider>
      </LocationEmitter>
    )
  }
}

if (__DEV__) {
  StaticRouter.propTypes = {
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
}

export default StaticRouter
