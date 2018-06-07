import React from "react";
import Switch from "react-router/Switch";
import Route from "react-router/Route";
import Redirect from "react-router/Redirect";
import generatePath from "react-router/generatePath";

const EMPTY = {};
const DEFAULT_ROUTE_PROP = "route";
const DEFAULT_RENDER_CHILD_PROP = "renderChild";
const DEFAULT_MATCH_PROP = "match";
const DEFAULT_ADD_PARAM_PROPS = false;

const renderRoutes = (
  routes,
  {
    extraProps = EMPTY,
    switchProps = EMPTY,
    routeProp = DEFAULT_ROUTE_PROP,
    matchProp = DEFAULT_MATCH_PROP,
    renderChildProp = DEFAULT_RENDER_CHILD_PROP,
    addParamProps = DEFAULT_ADD_PARAM_PROPS,
    noRenderChildComponent = () => false,
    overrideRenderRoutes = false
  } = {}
) => {
  if (!routes) {
    return null;
  }

  const renderChild = route => ({
    [routeProp]: stripRouteProp,
    [matchProp]: stripMatchProp,
    ...otherProps
  } = {}) =>
    route.routes
      ? (overrideRenderRoutes ? overrideRenderRoutes : renderRoutes).call(
          null,
          route.routes,
          {
            extraProps: otherProps,
            switchProps,
            routeProp,
            matchProp,
            renderChildProp,
            addParamProps,
            noRenderChildComponent,
            overrideRenderRoutes
          }
        )
      : noRenderChildComponent;

  const mergeRouteProps = (route, props) => {
    const { route: stripRoute, match, ...otherProps } = props;
    return {
      ...(route.props ? route.props : EMPTY),
      ...otherProps,
      ...extraProps,
      ...(route.forcedProps ? route.forcedProps : EMPTY),
      ...(routeProp ? { [routeProp]: route } : EMPTY),
      ...(matchProp ? { [matchProp]: match } : EMPTY),
      ...(addParamProps
        ? match
          ? match.params
            ? match.params
            : EMPTY
          : EMPTY
        : EMPTY),
      ...(renderChildProp ? { [renderChildProp]: renderChild(route) } : EMPTY)
    };
  };

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
            ) : route.component ? (
              <route.component {...mergeRouteProps(route, props)} />
            ) : (
              renderChild(route)(mergeRouteProps(route, props))
            )
          }
        />
      ))}
    </Switch>
  );
};

export default renderRoutes;
