import React, { PropTypes } from 'react'
import createBrowserHistory from 'history/createBrowserHistory'
import StaticRouter from './StaticRouter'
import History from './History'

const BrowserRouter = ({
  basename,
  forceRefresh,
  getUserConfirmation,
  keyLength,
  ...routerProps
}) => (
  <History
    createHistory={createBrowserHistory}
    historyOptions={{
      basename,
      forceRefresh,
      getUserConfirmation,
      keyLength
    }}
  >
    {({ history, action, location }) => (
      <StaticRouter
        action={action}
        location={location}
        basename={basename}
        onPush={history.push}
        onReplace={history.replace}
        blockTransitions={history.block}
        {...routerProps}
      />
    )}
  </History>
)

if (__DEV__) {
  BrowserRouter.propTypes = {
    basename: PropTypes.string,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }
}

export default BrowserRouter
