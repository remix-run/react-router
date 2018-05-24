import React from "react";
import Switch from "react-router/Switch";
import Route from "react-router/Route";
import Redirect from "react-router/Redirect";
import generatePath from "react-router/generatePath";

const EMPTY = {};
const DEFAULT_ROUTE_PROP = "route";
const DEFAULT_RENDER_CHILD_PROP = "renderChild";

const renderRoutes = (
  routes,
  {
    extraProps = EMPTY,
    switchProps = EMPTY,
    routeProp = DEFAULT_ROUTE_PROP,
    renderChildProp = DEFAULT_RENDER_CHILD_PROP,
    noRenderChildComponent = false,
    overrideRenderRoutes = false
  } = {}
) =>
  routes ? (
    <Switch {...switchProps}>
      {routes.map((route, i) => (
        <Route
          key={route.key || i}
          path={route.path}
          exact={route.exact}
          strict={route.strict}
          render={props =>
            route.redirect !== void 0 ? (
              <Redirect
                from={route.path}
                to={generatePath(route.redirect, props.match.params)}
              />
            ) : (
              <route.component
                {...(route.props ? route.props : EMPTY)}
                {...props}
                {...extraProps}
                {...(routeProp
                  ? {
                      [routeProp]: route
                    }
                  : {})}
                {...(renderChildProp
                  ? {
                      [renderChildProp]: (props = {}) =>
                        route.routes
                          ? (overrideRenderRoutes
                              ? overrideRenderRoutes
                              : renderRoutes
                            ).call(null, route.routes, {
                              extraProps: props,
                              switchProps,
                              renderChildProp,
                              noRenderChildComponent,
                              overrideRenderRoutes
                            })
                          : noRenderChildComponent
                    }
                  : {})}
                {...(route.forcedProps ? route.forcedProps : EMPTY)}
              />
            )
          }
        />
      ))}
    </Switch>
  ) : null;

export default renderRoutes;
