import React, { PropTypes } from 'react'
import MatchCountProvider from './MatchCountProvider'
import matchPattern from './matchPattern'

class RegisterMatch extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    match: PropTypes.any
  }

  static contextTypes = {
    matchCounter: PropTypes.object
  }

  componentWillMount() {
    const { matchCounter } = this.context
    const { match } = this.props
    if (match && matchCounter)
      matchCounter.registerMatch()
  }

  componentWillReceiveProps(nextProps) {
    const { matchCounter } = this.context
    if (matchCounter) {
      if (nextProps.match && !this.props.match) {
        matchCounter.registerMatch()
      } else if (!nextProps.match && this.props.match) {
        matchCounter.unregisterMatch()
      }
    }
  }

  componentWillUnmount() {
    if (this.props.match)
      this.context.matchCounter.unregisterMatch()
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

class Match extends React.Component {
  static propTypes = {
    children: PropTypes.func,
    render: PropTypes.func,
    component: PropTypes.func,

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
    const { children, render, component:Component,
      pattern, location, exactly } = this.props
    const loc = location || this.context.location
    const match = matchPattern(pattern, loc, exactly)
    const props = { ...match, location: loc, pattern }

    return (
      <RegisterMatch match={match}>
        <MatchCountProvider match={match}>
          {children ? (
            children({ matched: !!match, ...props })
          ) : match ? (
            render ? (
              render(props)
            ) : (
              <Component {...props}/>
            )
          ) : null}
        </MatchCountProvider>
      </RegisterMatch>
    )
  }
}

export default Match
