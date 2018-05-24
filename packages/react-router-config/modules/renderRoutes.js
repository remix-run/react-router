import React from "react";
import Switch from "react-router/Switch";
import Route from "react-router/Route";
import Redirect from "react-router/Redirect";
import generatePath from "react-router/generatePath";

const EMPTY = {};

const renderRoutes = (routes, extraProps = EMPTY, switchProps = EMPTY) =>
  routes ? (
    <Switch {...switchProps}>
      {routes.map(
        (route, i) =>
          route.redirect !== void 0 ? (
            <Route
              key={route.key || i}
              path={route.path}
              exact={route.exact}
              strict={route.strict}
              render={props => (
                <Redirect
                  from={route.path}
                  to={generatePath(route.redirect, props.match.params)}
                />
              )}
            />
          ) : (
            <Route
              key={route.key || i}
              path={route.path}
              exact={route.exact}
              strict={route.strict}
              render={props => (
                <route.component
                  {...(route.props ? route.props : EMPTY)}
                  {...props}
                  {...extraProps}
                  route={route}
                  {...(route.forcedProps ? route.forcedProps : EMPTY)}
                />
              )}
            />
          )
      )}
    </Switch>
  ) : null;

export default renderRoutes;
