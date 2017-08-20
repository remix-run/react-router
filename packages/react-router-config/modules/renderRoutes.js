import React from 'react'
import Switch from 'react-router/Switch'
import Route from 'react-router/Route'
import PrivateRoute from 'react-router/PrivateRoute'

const renderRoutes = (routes, extraProps = {}) => routes ? (
  <Switch>
    {routes.map((route, i) => (
      route.private ?
      <PrivateRoute key={i} redirectPath={extraProps.redirectPath} authenticated={extraProps.authenticated} path={route.path} exact={route.exact} strict={route.strict} render={(props) => (
        <route.component {...props} {...extraProps} route={route}/>
      )}/>
      :
      <Route key={i} path={route.path} exact={route.exact} strict={route.strict} render={(props) => (
        <route.component {...props} {...extraProps} route={route}/>
      )}/>
    ))}
  </Switch>
) : null

export default renderRoutes
