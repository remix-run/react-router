import React, { PropTypes } from 'react'
import pathToRegexp from 'path-to-regexp'
import MatchCountProvider from './MatchCountProvider'

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

const truncatePathnameToPattern = (pathname, pattern) =>
  pathname.split('/').slice(0, pattern.split('/').length).join('/')

const parseParams = (pattern, match, keys) =>
  match.slice(1).reduce((params, value, index) => {
    params[keys[index].name] = value
    return params
  }, {})

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

class RegisterMatch extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  }

  static contextTypes = {
    matchCounter: PropTypes.object
  }

  componentWillMount() {
    this.context.matchCounter.registerMatch()
  }

  componentWillUnmount() {
    this.context.matchCounter.unregisterMatch()
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

class Match extends React.Component {
  static propTypes = {
    children: PropTypes.func,
    // TODO: has to start w/ slash, create custom validator
    pattern: PropTypes.string,
    location: PropTypes.object,
    exactly: PropTypes.bool
  }

  static defaultProps = {
    exactly: false
  }

  static contextTypes = {
    location: PropTypes.object
  }

  render() {
    const { children:Child, pattern, location, exactly } = this.props
    const loc = location || this.context.location
    const match = matchPattern(pattern, loc, exactly)

    if (!match)
      return null

    return (
      <RegisterMatch>
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

export default Match
