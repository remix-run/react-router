import React, { PropTypes } from 'react'
import MatchCountProvider from './MatchCountProvider'
import matchPattern from './matchPattern'

const patternType = (props, propName, ...rest) => {
  if (props[propName].charAt(0) !== '/') {
    return new Error('The `pattern` prop must start with "/"')
  } else {
    return PropTypes.string(props, propName, ...rest)
  }
}

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
    pattern: patternType,
    exactly: PropTypes.bool,
    location: PropTypes.object,

    children: PropTypes.func,
    render: PropTypes.func,
    component: PropTypes.func
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
