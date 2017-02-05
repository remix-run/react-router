import React, { PropTypes } from 'react'
import invariant from 'invariant'

/**
 * The public API for putting history on context.router.
 */
class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      router: this.props.history
    }
  }

  render() {
    const { children } = this.props
    invariant(
      children == undefined || React.Children.count(children) === 1,
      'A <Router> may have only one child element'
    )

    return children ? React.Children.only(children) : null
  }
}

export default Router

