import React, { PropTypes } from 'react'
import BrowserHistory from 'react-history/BrowserHistory'
import StaticRouter from './StaticRouter'

/**
 * A router that uses the HTML5 history API.
 */
const BrowserRouter = ({ basename, forceRefresh, getUserConfirmation, keyLength, ...props }) => (
  <BrowserHistory
    basename={basename}
    forceRefresh={forceRefresh}
    getUserConfirmation={getUserConfirmation}
    keyLength={keyLength}
  >
    {({ history, action, location }) => (
      <StaticRouter
        action={action}
        location={location}
        basename={basename}
        onPush={history.push}
        onReplace={history.replace}
        blockTransitions={history.block}
        {...props}
      />
    )}
  </BrowserHistory>
)

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

export default BrowserRouter
