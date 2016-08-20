import React, { PropTypes } from 'react'
import MemoryHistory from 'react-history/MemoryHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that stores all locations in memory.
 */
const MemoryRouter = ({ initialEntries, initialIndex, keyLength, children }) => (
  <MemoryHistory
    initialEntries={initialEntries}
    initialIndex={initialIndex}
    keyLength={keyLength}
  >
    {({ action, location }) => (
      <HistoryRouter action={action} location={location} children={children}/>
    )}
  </MemoryHistory>
)

MemoryRouter.propTypes = {
  initialEntries: PropTypes.array,
  initialIndex: PropTypes.number,
  keyLength: PropTypes.number,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}

export default MemoryRouter
