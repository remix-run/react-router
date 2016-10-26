import React, { PropTypes } from 'react'
import MatchProvider from './MatchProvider'
import matchPattern from './matchPattern'

class Match extends React.Component {
  static defaultProps = {
    exactly: false
  }

  static contextTypes = {
    location: PropTypes.object,
    provider: PropTypes.object,
    serverRouter: PropTypes.object
  }

  constructor(props) {
    super(props)

    this.state = {
      match: null
    }

    this.update = (location) => {
      const match = this.matchCurrent(location)
      this.setState({
        match
      })
      return match !== null
    }
  }

  matchCurrent(location) {
    const {
      pattern,
      exactly
    } = this.props
    const { provider } = this.context
    const parent = provider && provider.parent
    return matchPattern(pattern, location, exactly, parent)
  }

  componentWillMount() {
    const loc = this.props.location || this.context.location
    const match = this.matchCurrent(loc)
    this.setState({
      match
    })

    const { serverRouter, provider } = this.context
    if (serverRouter && provider) {
      serverRouter.updateMatchStatus(
        provider.serverRouterIndex,
        match !== null
      )
      this.unsubscribe = provider.addMatch(this.update)
    } 
  }

  componentDidMount() {
    const { serverRouter, provider } = this.context
    if (!serverRouter && provider) {
      this.unsubscribe = provider.addMatch(this.update)
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const location = nextProps.location || nextContext.location
    const match = this.matchCurrent(location)
    this.setState({
      match
    })
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  render() {
    const { children, render, component:Component,
      pattern } = this.props
    const { match } = this.state
    const location = this.props.location || this.context.location
    const props = { ...match, location, pattern }
    return (
      <MatchProvider location={location} match={match}>
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
