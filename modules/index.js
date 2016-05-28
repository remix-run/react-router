import React from 'react'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import pathToRegexp from 'path-to-regexp'

const { object } = React.PropTypes

////////////////////////////////////////////////////////////////////////////////
class HistoryContext extends React.Component {

  static childContextTypes = {
    history: object
  }

  getChildContext() {
    return { history: this.props.history }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}


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
      <HistoryContext history={history}>
        <Child location={location}/>
      </HistoryContext>
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

class MatchLocation extends React.Component {
  state = {
    regex: null,
    keys: null
  }

  render() {
    const { children:Child, pattern, location } = this.props
    const keys = []
    // cache these next values in state to speed up
    const pathname = truncatePathname(location.pathname, pattern)
    const regex = pathToRegexp(pattern, keys)
    const match = regex.exec(pathname)
    //
    if (match) {
      const params = parseParams(pattern, match, keys)
      const locationLength = location.pathname.split('/').length
      const patternLength = pattern.split('/').length
      return (
        <Child
          isTerminal={locationLength === patternLength}
          pattern={pattern}
          location={location}
          params={params}
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
    history: object.isRequired
  }

  handleClick(event) {
    event.preventDefault()
    const { history } = this.context
    const { to } = this.props
    history.push(to)
  }

  render() {
    const { href, ...props } = this.props
    return (
      <a
        {...props}
        href={this.props.to}
        onClick={(event) => this.handleClick(event)}
      />
    )
  }

}


////////////////////////////////////////////////////////////////////////////////
export { History, MatchLocation, Link }

