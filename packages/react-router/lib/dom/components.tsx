import * as React from "react";

import type { Location, To } from "../router/history";
import {
  Action as NavigationType,
  invariant,
  parsePath,
} from "../router/history";
import type {
  Router as DataRouter,
  RouterState,
  StaticHandlerContext,
} from "../router/router";
import { isRouteErrorResponse } from "../router/utils";
import { Router } from "../components";
import type { DataRouteObject } from "../context";
import {
  DataRouterContext,
  DataRouterStateContext,
  FetchersContext,
  ViewTransitionContext,
} from "../context";
import { useRoutesImpl } from "../hooks";
import { createHref, encodeLocation } from "./shared";

export interface StaticRouterProps {
  basename?: string;
  children?: React.ReactNode;
  location: Partial<Location> | string;
}

/**
 * A `<Router>` that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 *
 * @category Router Components
 */
export function StaticRouter({
  basename,
  children,
  location: locationProp = "/",
}: StaticRouterProps) {
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }

  let action = NavigationType.Pop;
  let location: Location = {
    pathname: locationProp.pathname || "/",
    search: locationProp.search || "",
    hash: locationProp.hash || "",
    state: locationProp.state != null ? locationProp.state : null,
    key: locationProp.key || "default",
  };

  let staticNavigator = getStatelessNavigator();
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

export interface StaticRouterProviderProps {
  context: StaticHandlerContext;
  router: DataRouter;
  hydrate?: boolean;
  nonce?: string;
}

/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
 *
 * @category Router Components
 */
export function StaticRouterProvider({
  context,
  router,
  hydrate = true,
  nonce,
}: StaticRouterProviderProps) {
  invariant(
    router && context,
    "You must provide `router` and `context` to <StaticRouterProvider>"
  );

  let dataRouterContext = {
    router,
    navigator: getStatelessNavigator(),
    static: true,
    staticContext: context,
    basename: context.basename || "/",
  };

  let fetchersContext = new Map();

  let hydrateScript = "";

  if (hydrate !== false) {
    let data = {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: serializeErrors(context.errors),
    };
    // Use JSON.parse here instead of embedding a raw JS object here to speed
    // up parsing on the client.  Dual-stringify is needed to ensure all quotes
    // are properly escaped in the resulting string.  See:
    //   https://v8.dev/blog/cost-of-javascript-2019#json
    let json = htmlEscape(JSON.stringify(JSON.stringify(data)));
    hydrateScript = `window.__staticRouterHydrationData = JSON.parse(${json});`;
  }

  let { state } = dataRouterContext.router;

  return (
    <>
      <DataRouterContext.Provider value={dataRouterContext}>
        <DataRouterStateContext.Provider value={state}>
          <FetchersContext.Provider value={fetchersContext}>
            <ViewTransitionContext.Provider value={{ isTransitioning: false }}>
              <Router
                basename={dataRouterContext.basename}
                location={state.location}
                navigationType={state.historyAction}
                navigator={dataRouterContext.navigator}
                static={dataRouterContext.static}
              >
                <DataRoutes
                  routes={router.routes}
                  future={router.future}
                  state={state}
                />
              </Router>
            </ViewTransitionContext.Provider>
          </FetchersContext.Provider>
        </DataRouterStateContext.Provider>
      </DataRouterContext.Provider>
      {hydrateScript ? (
        <script
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: hydrateScript }}
        />
      ) : null}
    </>
  );
}

function DataRoutes({
  routes,
  future,
  state,
}: {
  routes: DataRouteObject[];
  future: DataRouter["future"];
  state: RouterState;
}): React.ReactElement | null {
  return useRoutesImpl(routes, undefined, state, future);
}

function serializeErrors(
  errors: StaticHandlerContext["errors"]
): StaticHandlerContext["errors"] {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized: StaticHandlerContext["errors"] = {};
  for (let [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // deserializeErrors in react-router-dom/index.tsx :)
    if (isRouteErrorResponse(val)) {
      serialized[key] = { ...val, __type: "RouteErrorResponse" };
    } else if (val instanceof Error) {
      // Do not serialize stack traces from SSR for security reasons
      serialized[key] = {
        message: val.message,
        __type: "Error",
        // If this is a subclass (i.e., ReferenceError), send up the type so we
        // can re-create the same type during hydration.
        ...(val.name !== "Error"
          ? {
              __subType: val.name,
            }
          : {}),
      };
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

function getStatelessNavigator() {
  return {
    createHref,
    encodeLocation,
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
}

// This utility is based on https://github.com/zertosh/htmlescape
// License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE
const ESCAPE_LOOKUP: { [match: string]: string } = {
  "&": "\\u0026",
  ">": "\\u003e",
  "<": "\\u003c",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

function htmlEscape(str: string): string {
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}
