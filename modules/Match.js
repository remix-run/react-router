import React, { PropTypes } from 'react'
import MatchProvider from './MatchProvider'
import matchPattern from './matchPattern'

const patternType = (props, propName) => {
  if (props[propName].charAt(0) !== '/')
    return new Error('The `pattern` prop must start with "/"')
}

class RegisterMatch extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    match: PropTypes.any
  }

  static contextTypes = {
    match: PropTypes.object
  }

  componentWillMount() {
    const { match:matchContext } = this.context
    const { match } = this.props

    if (match && matchContext)
      matchContext.addMatch(match)
  }

  componentWillReceiveProps(nextProps) {
    const { match } = this.context

    if (match) {
      if (nextProps.match && !this.props.match) {
        match.addMatch(nextProps.match)
      } else if (!nextProps.match && this.props.match) {
        match.removeMatch(this.props.match)
      }
    }
  }

  componentWillUnmount() {
    if (this.props.match)
      this.context.match.removeMatch(this.props.match)
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
    location: PropTypes.object,
    match: PropTypes.object
  }

  render() {
    const { children, render, component:Component,
      pattern, location, exactly } = this.props
    const loc = location || this.context.location
    const match = matchPattern(pattern, loc, exactly)
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
  }
}

export default Match
