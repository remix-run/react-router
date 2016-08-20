import React, { PropTypes } from 'react'
import HashHistory from 'react-history/HashHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that uses the URL hash.
 */
const HashRouter = ({ basename, hashType, children }) => (
  <HashHistory
    basename={basename}
    hashType={hashType}
  >
    {({ action, location }) => <HistoryRouter action={action} location={location} children={children}/>}
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
