import React from 'react'
import { Route, Redirect, Switch } from 'react-router'

const renderRoutes = (routes, authed, authPath, extraProps = {}, switchProps = {}) => routes ? (
  <Switch {...switchProps}>
    {routes.map((route, i) => (
      <Route
        key={route.key || i}
        path={route.path}
        exact={route.exact}
        strict={route.strict}
        render={(props) => {
          
          if( !route.restricted || authed || route.path == authPath) {
            return <route.component {...props} {...extraProps} route={route}/>
          }
          const redirPath = authPath ? authPath : '/login'
          return <Redirect to={{pathname: redirPath, state: {from: props.location}}}/>
        }}
      />
    ))}
  </Switch>
) : null

export default renderRoutes
