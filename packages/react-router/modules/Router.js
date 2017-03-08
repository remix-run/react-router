import warning from 'warning'
import invariant from 'invariant'
import React, { PropTypes } from 'react'

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  }

  static childContextTypes = {
    history: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      history: this.props.history,
      route: this.route
    }
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  }

  computeMatch(pathname) {
    return {
      path: '/',
      url: '/',
      params: {},
      isExact: pathname === '/'
    }
  }

  componentWillMount() {
    const { children, history } = this.props

    invariant(
      children == null || React.Children.count(children) === 1,
      'A <Router> may have only one child element'
    )

    this.route = {
      match: this.state.match,
      location: this.props.history.location
    }

    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.
    this.unlisten = history.listen(() => {
      const match = this.computeMatch(history.location.pathname)
      Object.assign(this.route, {
        location: history.location,
        match
      })
      this.setState({ match })
    })
  }

  componentWillReceiveProps(nextProps) {
    warning(
      this.props.history === nextProps.history,
      'You cannot change <Router history>'
    )
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

export default Router
