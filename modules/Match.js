import React, { PropTypes } from 'react'
import MatchProvider from './MatchProvider'
import matchPattern from './matchPattern'
import { LocationSubscriber } from './Broadcasts'

class RegisterMatch extends React.Component {
  static contextTypes = {
    match: PropTypes.object,
    serverRouter: PropTypes.object
  }

  registerMatch() {
    const { match:matchContext } = this.context
    const { match } = this.props

    if (match && matchContext) {
      matchContext.addMatch(match)
    }
  }

  componentWillMount() {
    if (this.context.serverRouter) {
      this.registerMatch()
    }
  }

  componentDidMount() {
    if (!this.context.serverRouter) {
      this.registerMatch()
    }
  }

  componentDidUpdate(prevProps) {
    const { match } = this.context

    if (match) {
      if (prevProps.match && !this.props.match) {
        match.removeMatch(prevProps.match)
      } else if (!prevProps.match && this.props.match) {
        match.addMatch(this.props.match)
      }
    }
  }

  componentWillUnmount() {
    if (this.props.match) {
      this.context.match.removeMatch(this.props.match)
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

if (__DEV__) {
  RegisterMatch.propTypes = {
    children: PropTypes.node.isRequired,
    match: PropTypes.any
  }
}

class Match extends React.Component {
  static defaultProps = {
    exactly: false
  }

  static contextTypes = {
    location: PropTypes.object,
    match: PropTypes.object
  }

  render() {
    return (
      <LocationSubscriber>
        {(locationContext) => {
          const { children, render, component:Component,
            pattern, location, exactly } = this.props
          const { match:matchContext } = this.context
          const loc = location || locationContext
          const parent = matchContext && matchContext.parent
          const match = matchPattern(pattern, loc, exactly, parent)
          const props = { ...match, location: loc, pattern }
          return (
            <RegisterMatch match={match}>
              <MatchProvider match={match}>
                {children ? (
                  children({ matched: !!match, ...props })
                ) : match ? (
                  render ? (
                    render(props)
                  ) : (
                    <Component {...props}/>
                  )
                ) : null}
              </MatchProvider>
            </RegisterMatch>
          )
        }}
      </LocationSubscriber>
    )
  }
}

if (__DEV__) {
  Match.propTypes = {
    pattern: PropTypes.string,
    exactly: PropTypes.bool,
    location: PropTypes.object,

    children: PropTypes.func,
    render: PropTypes.func,
    component: PropTypes.func
  }
}

export default Match
