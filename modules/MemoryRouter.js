import React from 'react'
import MemoryHistory from 'react-history/MemoryHistory'
import Router from './Router'

/**
 * The public API for a <Router> that stores location in memory.
 */
const MemoryRouter = (props) => (
  <MemoryHistory {...props}>
    <Router {...props}/>
  </MemoryHistory>
)

export default MemoryRouter
