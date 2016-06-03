import React from 'react'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import pathToRegexp from 'path-to-regexp'

const warning = () => {}

const { object, node, bool, string, func, oneOfType } = React.PropTypes
const funcOrNode = oneOfType([ func, node ])


////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Public API /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
class Router extends React.Component {

  static propTypes = {
    history: object,
    children: funcOrNode
  }

  render() {
    const { children, ...rest } = this.props
    return (
      <History {...rest}>
        <MatchCountProvider isTerminal={true}>
          <Match pattern="/" children={(props) => (
            <FuncOrNode children={children} props={props}/>
          )}/>
        </MatchCountProvider>
      </History>
    )
  }
}


////////////////////////////////////////////////////////////////////////////////
class Match extends React.Component {

  static propTypes = {
    children: func,
    // TODO: has to start w/ slash, create custom validator
    pattern: string,
    location: object,
    exactly: bool
  }

  static defaultProps = {
    exactly: false
  }

  static contextTypes = {
    location: object
  }

  render() {
    const { children:Child, pattern, location, exactly } = this.props
    const loc = location || this.context.location
    const match = matchPattern(pattern, loc, exactly)
    return !match ? null : (
      <RegisterMatch pattern={pattern}>
        <MatchCountProvider isTerminal={match.isTerminal}>
          <Child
            location={loc}
            pattern={pattern}
            pathname={match.pathname}
            params={match.params}
            isTerminal={match.isTerminal}
          />
        </MatchCountProvider>
      </RegisterMatch>
    )
  }

}


////////////////////////////////////////////////////////////////////////////////
class Miss extends React.Component {

  static propTypes = {
    children: funcOrNode
  }

  static contextTypes = {
    matchCounter: object.isRequired,
    location: object.isRequired
  }

  render() {
    const { children:Child } = this.props
    const { location, matchCounter } = this.context
    return matchCounter.matchFound ? null : <Child location={location} />
  }

}


////////////////////////////////////////////////////////////////////////////////
// needs accessibility stuff from React Router Link
class Link extends React.Component {

  static propTypes = {
    to: string,
    style: object,
    activeStyle: object,
    location: object,
    activeOnlyWhenExact: bool
  }

  static contextTypes = {
    history: object,
    location: object
  }

  static defaultProps = {
    activeOnlyWhenExact: false,
    style: {},
    activeStyle: {}
  }

  handleClick = (event) => {
    event.preventDefault()
    const { history } = this.context
    const { to } = this.props
    history.push(to)
  }

  render() {
    const {
      to,
      style,
      activeStyle,
      location,
      activeOnlyWhenExact,
      ...rest
    } = this.props
    const { pathname } = location || this.context.location
    const isActive = activeOnlyWhenExact ?
      pathname === to : pathname.startsWith(to)
    return (
      <a
        {...rest}
        href={to}
        style={isActive ? { ...style, ...activeStyle } : style}
        onClick={this.handleClick}
      />
    )
  }

}


////////////////////////////////////////////////////////////////////////////////
class BlockHistory extends React.Component {

  static propTypes = {
    when: bool,
    prompt: func
  }

  static contextTypes = {
    history: object
  }

  unlistenBefore = null

  componentDidMount() {
    this.maybeBlock()
  }

  componentDidUpdate() {
    this.maybeBlock()
  }

  componentWillUnmount() {
    this.unblock()
  }

  maybeBlock() {
    const { when } = this.props
    if (when) {
      this.block()
    } else {
      this.unblock()
    }
  }

  block() {
    const { history } = this.context
    const { prompt } = this.props
    if (!this.unlistenBefore) {
      this.unlistenBefore = history.listenBefore(prompt)
    }
  }

  unblock() {
    if (this.unlistenBefore) {
      this.unlistenBefore()
      this.unlistenBefore = null
    }
  }

  render() {
    return null
  }
}


////////////////////////////////////////////////////////////////////////////////
class Redirect extends React.Component {

  static contextTypes = {
    history: object
  }

  componentDidMount() {
    const { to, from, history } = this.props
    const providedHistory = history || this.context.history
    providedHistory.replace({
      pathname: to,
      state: { from }
    })
  }

  render() {
    return null
  }

}


////////////////////////////////////////////////////////////////////////////////
////////////////////////// Implementation details //////////////////////////////
////////////////////////////////////////////////////////////////////////////////
const isBrowserEnvironment = typeof window === 'object'

const locationType = (props, propName, componentName) => {
  const error = object(props, propName, componentName)

  if (error)
    return error

  if (props[propName] && typeof props.onChange !== 'function' && isBrowserEnvironment) {
    // TODO: Add link to history docs for onChange usage.
    return new Error(
      'You provided a `location` prop to a <History> component without an `onChange` handler. ' +
      'This will make the back/forward buttons and the address bar unusable. If you intend to let the ' +
      'user navigate using the browser\'s built-in controls, use `defaultLocation` with a `history` prop. ' +
      'Otherwise, set `onChange`.'
    )
  }
}

class History extends React.Component {

  static propTypes = {
    location: locationType,
    onChange: func,
    history: object,
    children: funcOrNode
  }

  static defaultProps = {
    history: createBrowserHistory()
  }

  state = {
    location: null
  }

  unlisten = null

  unlistenBefore = null

  // need to teardown and setup in cWRP too
  componentWillMount() {
    if (this.isControlled()) {
      this.listenBefore()
    } else {
      this.listen()
    }
  }

  componentWillReceiveProps(nextProps) {
    warning(
      nextProps.history === this.props.history,
      'Don’t change the history please. Thanks.'
    )

    if (nextProps.location && this.props.location == null) {
      this.switchToControlled()
    } else if (!nextProps.location && this.props.location) {
      this.switchToUncontrolled()
    }

    if (nextProps.location !== this.props.location) {
      this.transitioning = true
      const { location } = nextProps
      const { history } = this.props
      // FIXME: I don't think this is right
      if (location.action === 'PUSH') {
        history.push(location)
      } else {
        history.replace(location)
      }
    }
  }

  isControlled() {
    return !!this.props.location
  }

  listen() {
    const { history } = this.props

    this.setState({
      location: history.getCurrentLocation()
    })

    this.unlisten = history.listen(location => {
      this.setState({ location })
    })
  }

  listenBefore() {
    const { history, onChange } = this.props

    this.unlistenBefore = history.listenBefore((location) => {
      if (!this.transitioning) {
        if (onChange)
          onChange(location)

        return false
      } else {
        this.transitioning = false
        return true
      }
    })
  }

  switchToControlled() {
    this.unlisten()
    this.unlisten = null
    this.listen()
  }

  switchToUncontrolled() {
    this.unlistenBefore()
    this.unlistenBefore = null
    this.listen()
  }

  render() {
    const { children, history } = this.props
    const { location } = this.isControlled() ? this.props : this.state
    return (
      <HistoryProvider history={history}>
        <LocationProvider location={location}>
          <FuncOrNode props={{ location }} children={children}/>
        </LocationProvider>
      </HistoryProvider>
    )
  }
}


////////////////////////////////////////////////////////////////////////////////
const makeProvider = (contextName, type, displayName) => (
  class ContextProvider extends React.Component {
    static propTypes = {
      children: node
    }

    static childContextTypes = {
      [contextName]: type
    }

    static displayName = displayName

    getChildContext() {
      return {
        [contextName]: this.props[contextName]
      }
    }

    render() {
      return React.Children.only(this.props.children)
    }
  }
)


////////////////////////////////////////////////////////////////////////////////
const HistoryProvider = makeProvider('history', object, 'HistoryProvider')


////////////////////////////////////////////////////////////////////////////////
const LocationProvider = makeProvider('location', object, 'LocationProvider')


////////////////////////////////////////////////////////////////////////////////
class FuncOrNode extends React.Component {
  static propTypes = {
    children: funcOrNode,
    props: object
  }

  render() {
    const { props, children } = this.props
    let Child
    if (typeof children === 'function')
      Child = children
    return Child ? (
      <Child {...props}/>
    ) : React.Children.count(children) === 1 ? (
      children
    ) : (
      <div>{children}</div>
    )
  }
}


////////////////////////////////////////////////////////////////////////////////
class MatchCountProvider extends React.Component {

  static propTypes = {
    isTerminal: bool,
    children: node
  }

  static childContextTypes = {
    matchCounter: object
  }

  count = 0

  state = { count: 0 }

  registerMatch = () => {
    // have to manage manually since calling setState on same tick of event loop
    // would result in only `1` even though many may have registered
    this.count++
    this.setState({
      count: this.count
    })
  }

  unregisterMatch = () => {
    this.count--
    this.setState({
      count: this.count
    })
  }

  getChildContext() {
    return {
      matchCounter: {
        matchFound: this.props.isTerminal || this.state.count > 0,
        registerMatch: this.registerMatch,
        unregisterMatch: this.unregisterMatch
      }
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }

}


////////////////////////////////////////////////////////////////////////////////
class RegisterMatch extends React.Component {

  static propTypes = {
    children: node
  }

  static contextTypes = {
    matchCounter: object
  }

  componentWillMount() {
    this.context.matchCounter.registerMatch()
  }

  componentWillUnmount() {
    this.context.matchCounter.unregisterMatch()
  }

  render = () => {
    return React.Children.only(this.props.children)
  }

}


////////////////////////////////////////////////////////////////////////////////
const parseParams = (pattern, match, keys) => (
  match.slice(1).reduce((params, value, index) => {
    params[keys[index].name] = value
    return params
  }, {})
)


////////////////////////////////////////////////////////////////////////////////
const truncatePathnameToPattern = (pathname, pattern) => (
  pathname.split('/').slice(0, pattern.split('/').length).join('/')
)


////////////////////////////////////////////////////////////////////////////////
const matcherCache = {}

const getMatcher = (pattern) => {
  let matcher = matcherCache[pattern]
  if (!matcher) {
    const keys = []
    const regex = pathToRegexp(pattern, keys)
    matcher = matcherCache[pattern] = { keys, regex }
  }
  return matcher
}


////////////////////////////////////////////////////////////////////////////////
const matchPattern = (pattern, location, matchExactly) => {
  const specialCase = !matchExactly && pattern === '/'
  if (specialCase) {
    return {
      params: null,
      isTerminal: location.pathname === '/',
      pathname: '/'
    }
  } else {
    const matcher = getMatcher(pattern)
    const pathname = matchExactly ?
      location.pathname : truncatePathnameToPattern(location.pathname, pattern)
    const match = matcher.regex.exec(pathname)
    if (match) {
      const params = parseParams(pattern, match, matcher.keys)
      const locationLength = location.pathname.split('/').length
      const patternLength = pattern.split('/').length
      const isTerminal = locationLength === patternLength
      return { params, isTerminal, pathname }
    } else {
      return null
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
export {
  Router,
  Match,
  Miss,
  Link,
  BlockHistory,
  Redirect,
  History
}
