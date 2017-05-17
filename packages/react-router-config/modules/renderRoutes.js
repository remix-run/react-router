import React from 'react'
import Switch from 'react-router/Switch'
import Route from 'react-router/Route'

const renderRoutes = (routes, otherProps = {}) => routes ? (
  <Switch>
    {routes.map((route, i) => (
      <Route key={i} path={route.path} exact={route.exact} strict={route.strict} render={(props) => (
        <route.component {...props} {...otherProps} route={route}/>
      )}/>
    ))}
  </Switch>
) : null

export default renderRoutes
