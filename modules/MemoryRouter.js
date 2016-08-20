import React, { PropTypes } from 'react'
import MemoryHistory from 'react-history/MemoryHistory'
import HistoryRouter from './HistoryRouter'

/**
 * A router that stores all locations in memory.
 */
const MemoryRouter = ({ basename, initialEntries, initialIndex, keyLength, children }) => (
  <MemoryHistory
    basename={basename}
    initialEntries={initialEntries}
    initialIndex={initialIndex}
    keyLength={keyLength}
  >
    {({ action, location }) => <HistoryRouter children={children} action={action} location={location}/>}
  </MemoryHistory>
)

MemoryRouter.propTypes = {
  basename: PropTypes.string,
  initialEntries: PropTypes.array,
  initialIndex: PropTypes.number,
  keyLength: PropTypes.number,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}

export default MemoryRouter
