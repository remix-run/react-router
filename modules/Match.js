import React, { PropTypes } from 'react'
import matchPattern from './matchPattern'

class Match extends React.Component {
  matchCount = 0

  state = {
    match: null
  }

  static defaultProps = {
    exactly: false
  }

  static contextTypes = {
    router: PropTypes.object
  }

  static childContextTypes = {
    router: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)

    const match = this.getMatch()
    const parent = context.router.match

    if (parent && match)
      parent.registerMatch()

    this.state = { match: this.getMatch() }
  }

  getChildContext() {
    const match = {
      registerMatch: () => {
        this.matchCount++
        this.context.router.onMatch()
      },

      unregisterMatch: () => {
        this.matchCount--
      },

      getState: () => {
        return {
          match: this.state.match,
          matchCount: this.matchCount
        }
      }
    }

    return { router: { ...this.context.router, match } }
  }

  componentDidMount() {
    this.unlisten = this.context.router.subscribe(() => {
      this.matchCount = 0

      const parent = this.context.router.match
      const match = this.getMatch()

      if (parent && match)
        parent.registerMatch()

      this.setState({
        match: this.getMatch()
      })
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  getMatch() {
    const { router } = this.context
    const { pattern, exactly } = this.props
    const { location } = router.getState()
    const parent = router.match && router.match.getState().match
    return matchPattern(pattern, location, exactly, parent)
  }

  render() {
    const { children, render, component:Component, pattern } = this.props
    const { match } = this.state
    const { location } = this.context.router.getState()
    const props = { ...match, location, pattern }
    return (
      children ? (
        children({ matched: !!match, ...props })
      ) : match ? (
        render ? (
          render(props)
        ) : (
          <Component {...props}/>
        )
      ) : null
    )
  }
}

if (__DEV__) {
  Match.propTypes = {
    pattern: PropTypes.string,
    exactly: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.func
  }
}

// oh crap, what if mount/unmount w/o location change?  need to notify misses
// so they know to start or stop rendering geez...

export default Match
