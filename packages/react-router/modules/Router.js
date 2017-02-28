import warning from 'warning'
import invariant from 'invariant'
import Route from './Route'
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
    history: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      history: this.props.history
    }
  }

  componentWillMount() {
    const { children, history } = this.props

    invariant(
      children == null || React.Children.count(children) === 1,
      'A <Router> may have only one child element'
    )

    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.
    this.unlisten = history.listen(() => {
      this.forceUpdate()
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
    return children ? (
      <Route path="/" render={() => (
        React.Children.only(children)
      )}/>
    ) : null
  }
}

export default Router
