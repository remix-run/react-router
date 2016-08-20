import React, { PropTypes } from 'react'
import BrowserHistory from 'react-history/BrowserHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that uses the HTML5 history API.
 */
const BrowserRouter = ({ basename, keyLength, children }) => (
  <BrowserHistory
    basename={basename}
    keyLength={keyLength}
    children={children}
  >
    {({ action, location }) => <HistoryRouter action={action} location={location} children={children}/>}
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
