import React from 'react'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import pathToRegexp from 'path-to-regexp'

const { object } = React.PropTypes

const makeProvider = (name, type) => (
  class ContextProvider extends React.Component {

    static childContextTypes = {
      [name]: type
    }

    getChildContext() {
      return { [name]: this.props[name] }
    }

    render() {
      return React.Children.only(this.props.children)
    }
  }
)

////////////////////////////////////////////////////////////////////////////////
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
    location: window.location
  }

  componentDidMount = () => {
    const { history } = this.props
    history.listen(location => this.setState({ location }))
  }

  render = () => {
    const { children:Child, history } = this.props
    const { location } = this.state
    return (
      <HistoryProvider history={history}>
        <LocationProvider location={location}>
          <Child location={location}/>
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

const truncatePathname = (pathname, pattern) => (
  pathname.split('/').slice(0, pattern.split('/').length).join('/')
)

const matchPattern = (pattern, location) => {
  const keys = []
  const pathname = truncatePathname(location.pathname, pattern)
  const regex = pathToRegexp(pattern, keys)
  const match = regex.exec(pathname)
  if (match) {
    const params = parseParams(pattern, match, keys)
    const locationLength = location.pathname.split('/').length
    const patternLength = pattern.split('/').length
    const isTerminal = locationLength === patternLength
    return { match, params, isTerminal }
  } else {
    return null
  }
}


////////////////////////////////////////////////////////////////////////////////
class MatchLocation extends React.Component {
  state = {
    regex: null,
    keys: null
  }

  render() {
    const { children:Child, pattern, location } = this.props
    const match = matchPattern(pattern, location)
    if (match) {
      return (
        <Child
          location={location}
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
class Link extends React.Component {

  static contextTypes = {
    history: object,
    location: object
  }

  static defaultProps = {
    style: {},
    activeStyle: {}
  }

  handleClick(event) {
    event.preventDefault()
    const { history } = this.context
    const { to } = this.props
    history.push(to)
  }

  render() {
    const { to, style, activeStyle, location, ...props } = this.props
    const locationToMatch = location || this.context.location
    const isActive = locationToMatch ? !!matchPattern(to, locationToMatch) : false
    return (
      <a
        {...props}
        style={isActive ? { ...style, ...activeStyle } : style}
        href={to}
        onClick={(event) => this.handleClick(event)}
      />
    )
  }

}


////////////////////////////////////////////////////////////////////////////////
export { History, MatchLocation, Link }

