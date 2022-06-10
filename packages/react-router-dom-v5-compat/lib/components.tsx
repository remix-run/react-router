import * as React from "react";
import type { Location, To } from "history";
import { Action, createPath, parsePath } from "history";

// Get useHistory from react-router-dom v5 (peer dep).
// @ts-expect-error
import { useHistory, Route as RouteV5 } from "react-router-dom";

// We are a wrapper around react-router-dom v6, so bring it in
// and bundle it because an app can't have two versions of
// react-router-dom in its package.json.
import { Router, Routes, Route } from "../react-router-dom";

// v5 isn't in TypeScript, they'll also lose the @types/react-router with this
// but not worried about that for now.
export function CompatRoute(props: any) {
  let { location, path } = props;
  if (!props.exact) path += "/*";
  return (
    <Routes location={location}>
      <Route path={path} element={<RouteV5 {...props} />} />
    </Routes>
  );
}

export function CompatRouter({ children }: { children: React.ReactNode }) {
  let history = useHistory();
  let [state, setState] = React.useState(() => ({
    location: history.location,
    action: history.action,
  }));

  React.useLayoutEffect(() => {
    history.listen((location: Location, action: Action) =>
      setState({ location, action })
    );
  }, [history]);

  return (
    <Router
      navigationType={state.action}
      location={state.location}
      navigator={history}
    >
      <Routes>
        <Route path="*" element={children} />
      </Routes>
    </Router>
  );
}

export interface StaticRouterProps {
  basename?: string;
  children?: React.ReactNode;
  location: Partial<Location> | string;
}

/**
 * A <Router> that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 */
export function StaticRouter({
  basename,
  children,
  location: locationProp = "/",
}: StaticRouterProps) {
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }

  let action = Action.Pop;
  let location: Location = {
    pathname: locationProp.pathname || "/",
    search: locationProp.search || "",
    hash: locationProp.hash || "",
    state: locationProp.state || null,
    key: locationProp.key || "default",
  };

  let staticNavigator = {
    createHref(to: To) {
      return typeof to === "string" ? to : createPath(to);
    },
    push(to: To) {
      throw new Error(
        `You cannot use navigator.push() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`
      );
    },
    replace(to: To) {
      throw new Error(
        `You cannot use navigator.replace() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
          `in your app.`
      );
    },
    go(delta: number) {
      throw new Error(
        `You cannot use navigator.go() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${delta})\` somewhere in your app.`
      );
    },
    back() {
      throw new Error(
        `You cannot use navigator.back() on the server because it is a stateless ` +
          `environment.`
      );
    },
    forward() {
      throw new Error(
        `You cannot use navigator.forward() on the server because it is a stateless ` +
          `environment.`
      );
    },
  };

  return (
    <Router
      basename={basename}
      children={children}
      location={location}
      navigationType={action}
      navigator={staticNavigator}
      static={true}
    />
  );
}
