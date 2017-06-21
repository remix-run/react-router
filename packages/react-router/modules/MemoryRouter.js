import warning from 'warning'
import React from 'react'
import PropTypes from 'prop-types'
import createHistory from 'history/createMemoryHistory'
import Router from './Router'

/**
 * The public API for a <Router> that stores location in memory.
 */
class MemoryRouter extends React.Component {
  static propTypes = {
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.node
  }

  history = createHistory(this.props)

  render() {
    warning(
      !this.props.history,
      '<MemoryRouter> ignores the history prop. To use a custom history, ' +
      'make sure you are using `import { Router }` and not `import { MemoryRouter as Router }`.'
    )

    return <Router history={this.history} children={this.props.children}/>
  }
}

export default MemoryRouter
