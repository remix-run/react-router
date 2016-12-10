import React, { PropTypes, Component } from 'react'
import createBrowserHistory from 'history/createBrowserHistory'
import Router from './Router'

class BrowserRouter extends Component {
  componentWillMount() {
    const {
      basename,
      forceRefresh,
      getUserConfirmation,
      keyLength
    } = this.props

    this.history = createBrowserHistory({
      basename,
      forceRefresh,
      getUserConfirmation,
      keyLength
    })
  }

  render() {
    const {
      basename, // eslint-disable-line
      forceRefresh, // eslint-disable-line
      getUserConfirmation, // eslint-disable-line
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
  BrowserRouter.propTypes = {
    basename: PropTypes.string,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
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

export default BrowserRouter
