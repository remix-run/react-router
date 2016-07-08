import warning from 'warning'
import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'
import {
  history as historyType,
  location as locationType,
  router as routerType
} from './PropTypes'

class Router extends React.Component {
  static propTypes = {
    history: historyType,
    location: locationType,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    createHref: PropTypes.func,
    onPush: PropTypes.func,
    onReplace: PropTypes.func
  }

  static defaultProps = {
    createHref(to) {
      return this.props.history.createHref(to)
    },
    onPush(location) {
      if (this.props.history) {
        this.props.history.push(location)
      } else {
        warning(
          false,
          'Missing <Router history> prop; <Link>s won\'t work'
        )
      }
    },
    onReplace(location) {
      if (this.props.history) {
        this.props.history.replace(location)
      } else {
        warning(
          false,
          'Missing <Router history> prop; <Redirect>s won\'t work'
        )
      }
    }
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
        blockTransitions: this.blockTransitions
      }
    }
  }

  createHref = (to) => {
    return this.props.createHref.call(this, to)
  }

  transitionTo = (location) => {
    this.props.onPush.call(this, location)
  }

  replaceWith = (location) => {
    this.props.onReplace.call(this, location)
  }

  blockTransitions = (getPromptMessage) => {
    return this.props.history.listenBefore(getPromptMessage)
  }

  render() {
    const { children, history, location } = this.props

    return (
      <History history={history} location={location}>
        {({ location }) => (
          <MatchCountProvider>
            {typeof children === 'function' ? (
              children({ location })
            ) : React.Children.count(children) > 1 ? (
              <div>{children}</div>
            ) : (
              children
            )}
          </MatchCountProvider>
        )}
      </History>
    )
  }
}

export default Router
