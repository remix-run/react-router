import React from "react";
import Switch from "react-router/Switch";
import Route from "react-router/Route";
import Redirect from "react-router/Redirect";
import generatePath from "react-router/generatePath";

const EMPTY = {};
const DEFAULT_ROUTE_PROP = "route";
const DEFAULT_RENDER_CHILD_PROP = "renderChild";
const DEFAULT_MATCH_PROP = "match";

const renderRoutes = (
  routes,
  {
    extraProps = EMPTY,
    switchProps = EMPTY,
    routeProp = DEFAULT_ROUTE_PROP,
    renderChildProp = DEFAULT_RENDER_CHILD_PROP,
    matchProp = DEFAULT_MATCH_PROP,
    noRenderChildComponent = false,
    overrideRenderRoutes = false
  } = {}
) => {
  if (routes) {
    let renderChild = route => ({
      [routeProp]: stripRoute,
      [matchProp]: stripMatch,
      ...otherProps
    } = {}) =>
      route.routes
        ? (overrideRenderRoutes ? overrideRenderRoutes : renderRoutes).call(
            null,
            route.routes,
            {
              extraProps: otherProps,
              switchProps,
              renderChildProp,
              noRenderChildComponent,
              overrideRenderRoutes
            }
          )
        : noRenderChildComponent;
    let routeComponentProps = null;
    return (
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
                ((routeComponentProps = {
                  ...(route.props ? route.props : EMPTY),
                  ...props,
                  ...extraProps,
                  ...(route.forcedProps ? route.forcedProps : EMPTY)
                }),
                route.component ? (
                  <route.component
                    {...routeComponentProps}
                    {...(routeProp ? { [routeProp]: route } : EMPTY)}
                    {...(renderChildProp
                      ? { [renderChildProp]: renderChild(route) }
                      : EMPTY)}
                  />
                ) : (
                  renderChild(route)(routeComponentProps)
                ))
              )
            }
          />
        ))}
      </Switch>
    );
  }
  return null;
};

export default renderRoutes;
