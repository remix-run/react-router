import React from 'react'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import pathToRegexp from 'path-to-regexp'

const { object } = React.PropTypes

////////////////////////////////////////////////////////////////////////////////
const makeProvider = (name, type) => (
  class ContextProvider extends React.Component {
    static childContextTypes = { [name]: type }
    getChildContext = () => ({ [name]: this.props[name] })
    render = () => React.Children.only(this.props.children)
  }
)

const HistoryProvider = makeProvider('history', object)
const LocationProvider = makeProvider('location', object)


////////////////////////////////////////////////////////////////////////////////
// Have some weird thoughts around a controlled History component that this one
// could wrap, where we keep state here and then in the controlled component we'd
// listenBefore and not allow any transitions, just call up to `props.onChange`
// and wait for new props to come through (just like a controlled input). Then,
// if we get a new location (the one passed to `history.listenBefore` we can do
// a push or a replace (even have props.method === 'push') so the component is
// totally declarative and tells you what the current transition method was!
class History extends React.Component {

  static propTypes = {
    history: object.isRequired
  }

  static defaultProps = {
    history: createBrowserHistory()
  }

  state = {
    location: null
  }

  componentWillMount = () => {
    const { history } = this.props
    history.listen(location => this.setState({ location }))
  }

  render = () => {
    const { children, history } = this.props
    const { location } = this.state
    let Child
    // accept a component Class, function, or normal child nodes
    // if people want to pass everything as props, they can
    // use render props, otherwise they rely on context
    if (typeof children === 'function')
      Child = children
    return (
      <HistoryProvider history={history}>
        <LocationProvider location={location}>
          {Child ? (
            <Child location={location}/>
          ) : (
            <div>{this.props.children}</div>
          )}
        </LocationProvider>
      </HistoryProvider>
    )
  }
}


////////////////////////////////////////////////////////////////////////////////
const parseParams = (pattern, match, keys) => (
  match.slice(1).reduce((params, value, index) => {
    params[keys[index].name] = value
    return params
  }, {})
)

const truncatePathnameToPattern = (pathname, pattern) => (
  // need to special case pattern === '/' here
  pathname.split('/').slice(0, pattern.split('/').length).join('/')
)

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

const matchPattern = (pattern, location, activeOnlyWhenExact) => {
  const matcher = getMatcher(pattern)
  const pathname = activeOnlyWhenExact ?
    location.pathname : truncatePathnameToPattern(location.pathname, pattern)
  const match = matcher.regex.exec(pathname)
  if (match) {
    const params = parseParams(pattern, match, matcher.keys)
    const locationLength = location.pathname.split('/').length
    const patternLength = pattern.split('/').length
    const isTerminal = locationLength === patternLength
    return { match, params, isTerminal }
  } else {
    return null
  }
}


////////////////////////////////////////////////////////////////////////////////
// could optimize this by caching the `match` instead of calculating each render
// can't use sCU because of render prop
class MatchLocation extends React.Component {

  static defaultProps = {
    activeOnlyWhenExact: false
  }

  static contextTypes = {
    location: object
  }

  render = () => {
    const { children:Child, pattern, location, activeOnlyWhenExact } = this.props
    const locationToUse = location || this.context.location
    const match = matchPattern(pattern, locationToUse, activeOnlyWhenExact)
    if (match) {
      return (
        <Child
          location={locationToUse}
          pattern={pattern}
          params={match.params}
          isTerminal={match.isTerminal}
        />
      )
    } else {
      return null
    }
  }

}


////////////////////////////////////////////////////////////////////////////////
// obviously needs accessibility stuff from React Router Link
class Link extends React.Component {

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

  render = () => {
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
export { History, MatchLocation, Link }

