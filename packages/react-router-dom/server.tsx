import * as React from "react";
import type {
  AgnosticDataRouteObject,
  Path,
  RevalidationState,
  Router as RemixRouter,
  StaticHandlerContext,
} from "@remix-run/router";
import {
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  Action,
  invariant,
  isRouteErrorResponse,
  UNSAFE_convertRoutesToDataRoutes as convertRoutesToDataRoutes,
} from "@remix-run/router";
import type {
  DataRouteObject,
  Location,
  RouteObject,
  To,
} from "react-router-dom";
import { Routes } from "react-router-dom";
import {
  createPath,
  parsePath,
  Router,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_DataRouterStateContext as DataRouterStateContext,
  UNSAFE_enhanceManualRouteObjects as enhanceManualRouteObjects,
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
    let json = JSON.stringify(JSON.stringify(data));
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

// Temporary manifest generation - we should optimize this by combining the
// tree-walks between convertRoutesToDataRoutes, enhanceManualRouteObjects,
// and generateManifest.
// Also look into getting rid of `route as AgnosticDataRouteObject` down below?
function generateManifest(
  routes: DataRouteObject[],
  manifest: Map<string, DataRouteObject> = new Map<string, DataRouteObject>()
): Map<string, RouteObject> {
  routes.forEach((route) => {
    manifest.set(route.id, route);
    if (route.children) {
      generateManifest(route.children, manifest);
    }
  });
  return manifest;
}

export function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext
): RemixRouter {
  let dataRoutes = convertRoutesToDataRoutes(enhanceManualRouteObjects(routes));
  let manifest = generateManifest(dataRoutes);

  // Because our context matches may be from a framework-agnostic set of
  // routes passed to createStaticHandler(), we update them here with our
  // newly created/enhanced data routes
  let matches = context.matches.map((match) => {
    let route = manifest.get(match.route.id) || match.route;
    return {
      ...match,
      route: route as AgnosticDataRouteObject,
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
    _internalFetchControllers: new Map(),
    _internalActiveDeferreds: new Map(),
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
