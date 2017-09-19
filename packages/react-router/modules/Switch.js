import React from 'react'
import PropTypes from 'prop-types'
import warning from 'warning'
import invariant from 'invariant'
import matchPath from './matchPath'

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired
    }).isRequired
  }

  static propTypes = {
    children: PropTypes.node
  }

  componentWillMount() {
    invariant(
      this.context.router,
      'You should not use <Switch> outside a <Router>'
    )

    this.unlisten = this.context.router.history.listen(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { history: { location } } = this.context.router
    const { children } = this.props

    let match, child
    React.Children.forEach(children, element => {
      if (!React.isValidElement(element)) return

      const { path: pathProp, exact, strict, sensitive, from } = element.props
      const path = pathProp || from

      if (!match) {
        child = element
        match = !path || matchPath(location.pathname, { path, exact, strict, sensitive })
      }
    })

    return match ? child : null
  }
}

export default Switch
