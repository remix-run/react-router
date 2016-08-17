import React from 'react'
import MemoryHistory from 'react-history/MemoryHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that stores all locations in memory.
 */
const MemoryRouter = (props) => (
  <MemoryHistory {...props}>
    {state => <HistoryRouter {...props} {...state}/>}
  </MemoryHistory>
)

export default MemoryRouter
