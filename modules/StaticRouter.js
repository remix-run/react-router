import React, { PropTypes } from 'react'
import MatchCountProvider from './MatchCountProvider'
import {
  action as actionType,
  location as locationType,
  router as routerType
} from './PropTypes'

class StaticRouter extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    action: actionType.isRequired,
    location: locationType.isRequired,
    createHref: PropTypes.func.isRequired,
    onPush: PropTypes.func.isRequired,
    onReplace: PropTypes.func.isRequired,
    blockTransitions: PropTypes.func.isRequired
  }

  static defaultProps = {
    createHref: () => {},
    onPush: () => {},
    onReplace: () => {},
    blockTransitions: () => {}
  }

  static childContextTypes = {
    location: locationType.isRequired,
    router: routerType.isRequired
  }

  getChildContext() {
    return {
      location: this.props.location,
      router: {
        createHref: (to) => this.props.createHref(to),
        transitionTo: (loc) => this.props.onPush(loc),
        replaceWith: (loc) => this.props.onReplace(loc),
        blockTransitions: (getPromptMessage) => this.blockTransitions(getPromptMessage)
      }
    }
  }

  render() {
    const { children, location } = this.props

    return (
      <MatchCountProvider>
        {typeof children === 'function' ? (
          children({ location })
        ) : React.Children.count(children) > 1 ? (
          // TODO: Get rid of all DOM stuff.
          <div>{children}</div>
        ) : (
          children
        )}
      </MatchCountProvider>
    )
  }
}

export default StaticRouter
