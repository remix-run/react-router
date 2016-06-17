import React, { PropTypes } from 'react'
import MatchCountProvider from './MatchCountProvider'
import MultiRender from './MultiRender'
import matchPattern from './matchPattern'

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
    children: PropTypes.node,
    render: PropTypes.func,
    renderAlways: PropTypes.func,
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
    const {
      children,
      render,
      // this thing is just crap to get TransitionMotion to
      // work, need to bikeshed it into `children` or `render`
      // or something...
      renderAlways,
      component,
      pattern,
      location,
      exactly
    } = this.props
    const loc = location || this.context.location
    const match = matchPattern(pattern, loc, exactly)
    const props = match ? {
      location: loc,
      pattern,
      pathname: match.pathname,
      params: match.params,
      isTerminal: match.isTerminal
    } : { location: loc }

    if (renderAlways) {
      return renderAlways(!!match, props)
    } else {
      if (!match) {
        return null
      } else {
        return (
          <RegisterMatch>
            <MatchCountProvider isTerminal={match.isTerminal}>
              <MultiRender
                props={props}
                children={children}
                component={component}
                render={render}
              />
            </MatchCountProvider>
          </RegisterMatch>
        )
      }
    }
  }
}

export default Match
