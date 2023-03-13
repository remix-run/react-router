import * as React from "react";
import type {
  Path,
  RevalidationState,
  Router as RemixRouter,
  StaticHandlerContext,
  CreateStaticHandlerOptions as RouterCreateStaticHandlerOptions,
  UNSAFE_RouteManifest as RouteManifest,
} from "@remix-run/router";
import {
  IDLE_BLOCKER,
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  Action,
  UNSAFE_invariant as invariant,
  isRouteErrorResponse,
  createStaticHandler as routerCreateStaticHandler,
  UNSAFE_convertRoutesToDataRoutes as convertRoutesToDataRoutes,
} from "@remix-run/router";
import type { Location, RouteObject, To } from "react-router-dom";
import { Routes } from "react-router-dom";
import {
  createPath,
  parsePath,
  Router,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
} from "react-router-dom";

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

export { StaticHandlerContext };

export interface StaticRouterProviderProps {
  context: StaticHandlerContext;
  router: RemixRouter;
  hydrate?: boolean;
  nonce?: string;
}

/**
 * A Data Router that may not navigate to any other location. This is useful
 * on the server where there is no stateful UI.
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

  return (
    <>
      <DataRouterContext.Provider value={dataRouterContext}>
        <DataRouterStateContext.Provider value={dataRouterContext.router.state}>
          <Router
            basename={dataRouterContext.basename}
            location={dataRouterContext.router.state.location}
            navigationType={dataRouterContext.router.state.historyAction}
            navigator={dataRouterContext.navigator}
          >
            <Routes />
          </Router>
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

let detectErrorBoundary = (route: RouteObject) =>
  Boolean(route.ErrorBoundary) || Boolean(route.errorElement);

type CreateStaticHandlerOptions = Omit<
  RouterCreateStaticHandlerOptions,
  "detectErrorBoundary"
>;

export function createStaticHandler(
  routes: RouteObject[],
  opts?: CreateStaticHandlerOptions
) {
  return routerCreateStaticHandler(routes, {
    ...opts,
    detectErrorBoundary,
  });
}

export function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext
): RemixRouter {
  let manifest: RouteManifest = {};
  let dataRoutes = convertRoutesToDataRoutes(
    routes,
    detectErrorBoundary,
    undefined,
    manifest
  );

  // Because our context matches may be from a framework-agnostic set of
  // routes passed to createStaticHandler(), we update them here with our
  // newly created/enhanced data routes
  let matches = context.matches.map((match) => {
    let route = manifest[match.route.id] || match.route;
    return {
      ...match,
      route,
    };
  });

  let msg = (method: string) =>
    `You cannot use router.${method}() on the server because it is a stateless environment`;

  return {
    get basename() {
      return context.basename;
    },
    get state() {
      return {
        historyAction: Action.Pop,
        location: context.location,
        matches,
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: context.errors,
        initialized: true,
        navigation: IDLE_NAVIGATION,
        restoreScrollPosition: null,
        preventScrollReset: false,
        revalidation: "idle" as RevalidationState,
        fetchers: new Map(),
        blockers: new Map(),
      };
    },
    get routes() {
      return dataRoutes;
    },
    initialize() {
      throw msg("initialize");
    },
    subscribe() {
      throw msg("subscribe");
    },
    enableScrollRestoration() {
      throw msg("enableScrollRestoration");
    },
    navigate() {
      throw msg("navigate");
    },
    fetch() {
      throw msg("fetch");
    },
    revalidate() {
      throw msg("revalidate");
    },
    createHref,
    encodeLocation,
    getFetcher() {
      return IDLE_FETCHER;
    },
    deleteFetcher() {
      throw msg("deleteFetcher");
    },
    dispose() {
      throw msg("dispose");
    },
    getBlocker() {
      return IDLE_BLOCKER;
    },
    deleteBlocker() {
      throw msg("deleteBlocker");
    },
    _internalFetchControllers: new Map(),
    _internalActiveDeferreds: new Map(),
    _internalSetRoutes() {
      throw msg("_internalSetRoutes");
    },
  };
}

function createHref(to: To) {
  return typeof to === "string" ? to : createPath(to);
}

function encodeLocation(to: To): Path {
  // Locations should already be encoded on the server, so just return as-is
  let path = typeof to === "string" ? parsePath(to) : to;
  return {
    pathname: path.pathname || "",
    search: path.search || "",
    hash: path.hash || "",
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
