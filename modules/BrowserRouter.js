import React, { PropTypes } from 'react'
import BrowserHistory from 'react-history/BrowserHistory'
import StaticRouter from './StaticRouter'

/**
 * A router that uses the HTML5 history API.
 */
const BrowserRouter = ({ basename, keyLength, ...rest }) => (
  <BrowserHistory basename={basename} keyLength={keyLength}>
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
  </BrowserHistory>
)

BrowserRouter.propTypes = {
  basename: PropTypes.string,
  keyLength: PropTypes.number,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}

export default BrowserRouter
