import React from "react";
import { Route } from "react-router";
import matchRoutes from "./matchRoutes";

function renderRoutes(routes, extraProps = {}) {
  if (!routes) {
    return null;
  }

  return (
    <Route
      render={({ location }) => {
        const branches = matchRoutes(routes, location.pathname);

        return branches.reduceRight(
          (children, { route, match }) =>
            route.render ? (
              route.render({ ...extraProps, route, match, children })
            ) : (
              <route.component
                {...extraProps}
                route={route}
                match={match}
                children={children}
              />
            ),
          null
        );
      }}
    />
  );
}

export default renderRoutes;
