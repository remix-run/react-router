import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'
import {
  router as routerType
} from './PropTypes'

class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ])
  }

  static childContextTypes = {
    router: routerType.isRequired
  }

  getChildContext() {
    return {
      router: {
        createHref: this.createHref,
        transitionTo: this.transitionTo,
        replaceWith: this.replaceWith,
        go: this.go
      }
    }
  }

  createHref = (to) => {
    return this.props.history.createHref(to)
  }

  transitionTo = (location) => {
    this.props.history.push(location)
  }

  replaceWith = (location) => {
    this.props.history.replace(location)
  }

  go = (n) => {
    this.props.history.go(n)
  }

  render() {
    const { children, ...rest } = this.props

    return (
      <History {...rest}>
        {({ location }) => (
          <MatchCountProvider>
            {typeof children === 'function' ? (
              children({ location })
            ) : React.Children.count(children) === 1 ? (
              children
            ) : (
              <div>{children}</div>
            )}
          </MatchCountProvider>
        )}
      </History>
    )
  }
}

export default Router
