import React, { PropTypes } from 'react'
import HashHistory from 'react-history/HashHistory'
import StaticRouter from './StaticRouter'

/**
 * A router that uses the URL hash.
 */
const HashRouter = ({ basename, getUserConfirmation, hashType, ...props }) => (
  <HashHistory
    basename={basename}
    getUserConfirmation={getUserConfirmation}
    hashType={hashType}
  >
    {({ history, action, location }) => (
      <StaticRouter
        action={action}
        location={location}
        basename={basename}
        onPush={history.push}
        onReplace={history.replace}
        onGo={history.go}
        {...props}
      />
    )}
  </HashHistory>
)

HashRouter.propTypes = {
  basename: PropTypes.string,
  getUserConfirmation: PropTypes.func,
  hashType: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}

export default HashRouter
