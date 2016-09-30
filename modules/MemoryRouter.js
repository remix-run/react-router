import React, { PropTypes } from 'react'
import MemoryHistory from 'react-history/MemoryHistory'
import StaticRouter from './StaticRouter'

/**
 * A router that stores all locations in memory.
 */
const MemoryRouter = ({ getUserConfirmation, initialEntries, initialIndex, keyLength, ...props }) => (
  <MemoryHistory
    getUserConfirmation={getUserConfirmation}
    initialEntries={initialEntries}
    initialIndex={initialIndex}
    keyLength={keyLength}
  >
    {({ history, action, location }) => (
      <StaticRouter
        action={action}
        location={location}
        onPush={history.push}
        onReplace={history.replace}
        blockTransitions={history.block}
        {...props}
      />
    )}
  </MemoryHistory>
)

if (__DEV__) {
  MemoryRouter.propTypes = {
    getUserConfirmation: PropTypes.func,
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    keyLength: PropTypes.number,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }
}

export default MemoryRouter
