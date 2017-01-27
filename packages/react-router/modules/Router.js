import React, { PropTypes } from 'react'

/**
 * The public API for putting history on context.router.
 */
class Router extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    history: PropTypes.object.isRequired
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
    return children ? React.Children.only(children) : null
  }
}

export default Router

