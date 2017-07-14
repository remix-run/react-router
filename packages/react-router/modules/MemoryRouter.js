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

  componentWillMount() {
    warning(
      !this.props.history,
      '<MemoryRouter> ignores the history prop. To use a custom history, ' +
      'use `import { Router }` instead of `import { MemoryRouter as Router }`.'
    )
  }

  render() {
    return <Router history={this.history} children={this.props.children}/>
  }
}

export default MemoryRouter
