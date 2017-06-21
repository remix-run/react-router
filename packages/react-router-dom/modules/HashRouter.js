import warning from 'warning'
import React from 'react'
import PropTypes from 'prop-types'
import createHistory from 'history/createHashHistory'
import { Router } from 'react-router'

/**
 * The public API for a <Router> that uses window.location.hash.
 */
class HashRouter extends React.Component {
  static propTypes = {
    basename: PropTypes.string,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.oneOf([ 'hashbang', 'noslash', 'slash' ]),
    children: PropTypes.node
  }

  history = createHistory(this.props)

  render() {
    warning(
      !this.props.history,
      '<HashRouter> ignores the history prop. To use a custom history, ' +
      'make sure you are using `import { Router }` and not `import { HashRouter as Router }`.'
    )

    return <Router history={this.history} children={this.props.children}/>
  }
}

export default HashRouter
