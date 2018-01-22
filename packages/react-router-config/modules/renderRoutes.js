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
            const precondition = typeof route.precondition === 'function' ? route.precondition : () => true
            if (precondition(props)) {
              return <route.component {...props} {...extraProps} route={route} />
            }
            if (typeof route.onPreconditionFailed === 'function') {
              return <route.onPreconditionFailed {...props} {...extraProps} route={route} />
            }
            return null
          }}
        />
      ))}
    </Switch>
  ) : null;

export default renderRoutes;
