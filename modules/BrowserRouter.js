import React from 'react'
import BrowserHistory from 'react-history/BrowserHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that uses the HTML5 history API.
 */
const BrowserRouter = (props) => (
  <BrowserHistory {...props}>
    {state => <HistoryRouter {...props} {...state}/>}
  </BrowserHistory>
)

export default BrowserRouter
