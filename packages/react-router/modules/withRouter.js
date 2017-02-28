import React from 'react'
import Route from './Route'

/**
 * A public higher-order component to access the imperative API
 */
const withRouter = (Component) => {
  const C = (props) => (
    <Route render={routeComponentProps => (
      <Component {...props} {...routeComponentProps}/>
    )}/>
  )

  C.displayName = `withRouter(${Component.displayName || Component.name})`

  return C
}

export default withRouter
