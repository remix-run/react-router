import React, { PropTypes } from 'react'
import createHistory from 'history/createMemoryHistory'
import Router from './Router'

/**
 * The public API for a <Router> that stores location in memory.
 */
class MemoryRouter extends React.Component {
  static propTypes = {
    getUserConfirmation: PropTypes.func,
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    keyLength: PropTypes.number,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }

  componentWillMount() {
    this.history = createHistory(this.props)
  }

  render() {
    return <Router history={this.history} children={this.props.children}/>
  }
}

export default MemoryRouter
