import React from 'react'
import HashHistory from 'react-history/HashHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that uses the URL hash.
 */
const HashRouter = (props) => (
  <HashHistory {...props}>
    {state => <HistoryRouter {...props} {...state}/>}
  </HashHistory>
)

export default HashRouter
