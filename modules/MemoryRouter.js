import React, { PropTypes } from 'react'
import MemoryHistory from 'react-history/MemoryHistory'
import StaticRouter from './StaticRouter'

/**
 * A router that stores all locations in memory.
 */
const MemoryRouter = ({
  initialEntries,
  initialIndex,
  keyLength,
  ...rest
}) => (
  <MemoryHistory
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
        canGo={history.canGo}
        {...rest}
      />
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
