import React from "react";
import Switch from "react-router/Switch";
import Route from "react-router/Route";

const renderRoutes = (routes, extraProps = {}, switchProps = {}) =>
  routes ? (
    <Switch {...switchProps}>
      {routes.map((route, i) => (
        <Route
          key={route.key || i}
          path={route.path}
          exact={route.exact}
          strict={route.strict}
          render={props => {
            if (route.render) {
              return route.render({ ...props, ...extraProps, route: route })
            } else {
              return route.routes
                ? ( <route.component {...props} {...extraProps} route={route}>
                      {renderRoutes(route.routes, extraProps, switchProps)}
                    </route.component> )
                : ( <route.component {...props} {...extraProps} route={route} /> )
            }
          }
        />
      ))}
    </Switch>
  ) : null;

export default renderRoutes;
