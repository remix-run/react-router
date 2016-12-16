import React from 'react'
import BrowserHistory from 'react-history/BrowserHistory'
import Router from './Router'

/**
 * The public API for a <Router> that uses HTML5 history.
 */
const BrowserRouter = (props) => (
  <BrowserHistory {...props}>
    <Router {...props}/>
  </BrowserHistory>
)

export default BrowserRouter
