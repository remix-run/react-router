import React from 'react'
import HashHistory from 'react-history/HashHistory'
import Router from './Router'

/**
 * The public API for a <Router> that uses window.location.hash.
 */
const HashRouter = (props) => (
  <HashHistory {...props}>
    <Router {...props}/>
  </HashHistory>
)

export default HashRouter
