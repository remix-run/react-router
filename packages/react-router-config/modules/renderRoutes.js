import React from "react";
import { Switch, Route } from "react-router";
import KeepAlive, { AliveScope } from 'react-activation';

function renderRoutes(routes, extraProps = {}, switchProps = {}) {
  return routes ? (
   <AliveScope> 
    <Switch {...switchProps}>
      {routes.map((route, i) => (
        <Route
          key={route.key || i}
          path={route.path}
          exact={route.exact}
          strict={route.strict}
          render={props =>
            route.render ? (
              route.render({ ...props, ...extraProps, route: route })
            ) : (
             <KeepAlive when={route.cache}> 
              <route.component {...props} {...extraProps} route={route} />
             </KeepAlive> 
            )
          }
        />
      ))}
    </Switch>
 </AliveScope>
  ) : null;
}

export default renderRoutes;

