import React, { PropTypes } from 'react'
import HashHistory from 'react-history/HashHistory'
import StaticRouter from './StaticRouter'

/**
 * A router that uses the URL hash.
 */
const HashRouter = ({ basename, hashType, ...rest }) => (
  <HashHistory basename={basename} hashType={hashType}>
    {({ history, action, location }) => (
      <StaticRouter
        action={action}
        location={location}
        onPush={history.push}
        onReplace={history.replace}
        onGo={history.go}
        {...rest}
      />
    )}
  </HashHistory>
)

HashRouter.propTypes = {
  basename: PropTypes.string,
  hashType: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}

export default HashRouter
