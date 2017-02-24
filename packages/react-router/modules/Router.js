import invariant from 'invariant'
import React, { PropTypes } from 'react'

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
      router: this.router
    }
  }

  componentWillMount() {
    const { children, history } = this.props

    invariant(
      children == null || React.Children.count(children) === 1,
      'A <Router> may have only one child element'
    )

    this.router = {
      ...history,
      match: {
        path: '/',
        url: '/',
        params: {},
        isExact: history.location.pathname === '/'
      }
    }

    history.listen(() => {
      Object.assign(this.router, history)
      Object.assign(this.router.match, {
        isExact: history.location.pathname === '/'
      })
    })
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

export default Router
