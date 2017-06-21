import warning from 'warning'
import React from 'react'
import PropTypes from 'prop-types'
import createHistory from 'history/createBrowserHistory'
import { Router } from 'react-router'

/**
 * The public API for a <Router> that uses HTML5 history.
 */
class BrowserRouter extends React.Component {
  static propTypes = {
    basename: PropTypes.string,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.node
  }

  history = createHistory(this.props)

  render() {
    warning(
      !this.props.history,
      '<BrowserRouter> ignores the history prop. To use a custom history, ' +
      'make sure you are using `import { Router }` and not `import { BrowserRouter as Router }`.'
    )

    return <Router history={this.history} children={this.props.children}/>
  }
}

export default BrowserRouter
