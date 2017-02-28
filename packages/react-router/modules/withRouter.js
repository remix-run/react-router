import React from 'react'
import Route from './Route'

/**
 * A public higher-order component for re-rendering as the
 * location changes. Also, passes through all <Route> props
 * on the "router" prop.
 */
const withRouter = (component) => {
  const c = (props) => (
    <Route render={router => (
      React.createElement(component, { ...props, router })
    )}/>
  )

  c.displayName = `withRouter(${component.displayName || component.name})`

  return c
}

export default withRouter
