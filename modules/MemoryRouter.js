import React, { PropTypes, Component } from 'react'
import createMemoryHistory from 'history/createMemoryHistory'
import Router from './Router'

class MemoryRouter extends Component {
  componentWillMount() {
    const {
      getUserConfirmation,
      initialEntries,
      initialIndex,
      keyLength
    } = this.props

    this.history = createMemoryHistory({
      getUserConfirmation,
      initialEntries,
      initialIndex,
      keyLength
    })
  }

  render() {
    const {
      getUserConfirmation, // eslint-disable-line
      initialEntries, // eslint-disable-line
      initialIndex, // eslint-disable-line
      keyLength, // eslint-disable-line
      ...routerProps
    } = this.props

    return (
      <Router
        history={this.history}
        {...routerProps}
      />
    )
  }
}

if (__DEV__) {
  MemoryRouter.propTypes = {
    getUserConfirmation: PropTypes.func,
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    keyLength: PropTypes.number,

    // StaticRouter props
    stringifyQuery: PropTypes.func,
    parseQueryString: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }
}

export default MemoryRouter
