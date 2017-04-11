import React from 'react'
import Switch from 'react-router/Switch'
import Route from 'react-router/Route'

const renderRoutes = (routes) => routes ? (
  <Switch>
    {routes.map((route, i) => (
      <Route key={i} path={route.path} exact={route.exact} strict={route.strict} render={(props) => (
        <route.component {...props} route={route}/>
      )}/>
    ))}
  </Switch>
) : null

export default renderRoutes
