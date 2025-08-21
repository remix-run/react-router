import * as React from "react";

import type { Location, Path, To } from "../router/history";
import {
  Action as NavigationType,
  createPath,
  invariant,
  parsePath,
} from "../router/history";
import type {
  FutureConfig,
  Router as DataRouter,
  RevalidationState,
  CreateStaticHandlerOptions as RouterCreateStaticHandlerOptions,
  RouterState,
  StaticHandlerContext,
} from "../router/router";
import {
  IDLE_BLOCKER,
  IDLE_FETCHER,
  IDLE_NAVIGATION,
  createStaticHandler as routerCreateStaticHandler,
} from "../router/router";
import type { RouteManifest } from "../router/utils";
import {
  convertRoutesToDataRoutes,
  isRouteErrorResponse,
} from "../router/utils";
import { Router, mapRouteProperties } from "../components";
import type { DataRouteObject, RouteObject } from "../context";
import {
  DataRouterContext,
  DataRouterStateContext,
  FetchersContext,
  ViewTransitionContext,
} from "../context";
import { useRoutesImpl } from "../hooks";

/**
 * @category Types
 */
export interface StaticRouterProps {
  /**
   * The base URL for the static router (default: `/`)
   */
  basename?: string;
  /**
   * The child elements to render inside the static router
   */
  children?: React.ReactNode;
  /**
   * The {@link Location} to render the static router at (default: `/`)
   */
  location: Partial<Location> | string;
}

/**
 * A {@link Router | `<Router>`} that may not navigate to any other {@link Location}.
 * This is useful on the server where there is no stateful UI.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {StaticRouterProps.basename} props.basename n/a
 * @param {StaticRouterProps.children} props.children n/a
 * @param {StaticRouterProps.location} props.location n/a
 * @returns A React element that renders the static {@link Router | `<Router>`}
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

/**
 * @category Types
 */
export interface StaticRouterProviderProps {
  /**
   * The {@link StaticHandlerContext} returned from {@link StaticHandler}'s
   * `query`
   */
  context: StaticHandlerContext;
  /**
   * The static {@link DataRouter} from {@link createStaticRouter}
   */
  router: DataRouter;
  /**
   * Whether to hydrate the router on the client (default `true`)
   */
  hydrate?: boolean;
  /**
   * The [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
   * to use for the hydration [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
   * tag
   */
  nonce?: string;
}

/**
 * A {@link DataRouter} that may not navigate to any other {@link Location}.
 * This is useful on the server where there is no stateful UI.
 *
 * @example
 * export async function handleRequest(request: Request) {
 *   let { query, dataRoutes } = createStaticHandler(routes);
 *   let context = await query(request));
 *
 *   if (context instanceof Response) {
 *     return context;
 *   }
 *
 *   let router = createStaticRouter(dataRoutes, context);
 *   return new Response(
 *     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
 *     { headers: { "Content-Type": "text/html" } }
 *   );
 * }
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param props Props
 * @param {StaticRouterProviderProps.context} props.context n/a
 * @param {StaticRouterProviderProps.hydrate} props.hydrate n/a
 * @param {StaticRouterProviderProps.nonce} props.nonce n/a
 * @param {StaticRouterProviderProps.router} props.router n/a
 * @returns A React element that renders the static router provider
 */
export function StaticRouterProvider({
  context,
  router,
  hydrate = true,
  nonce,
}: StaticRouterProviderProps) {
  invariant(
    router && context,
    "You must provide `router` and `context` to <StaticRouterProvider>",
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
  return useRoutesImpl(routes, undefined, state, undefined, future);
}

function serializeErrors(
  errors: StaticHandlerContext["errors"],
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
          `\`navigate(${JSON.stringify(to)})\` somewhere in your app.`,
      );
    },
    replace(to: To) {
      throw new Error(
        `You cannot use navigator.replace() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere ` +
          `in your app.`,
      );
    },
    go(delta: number) {
      throw new Error(
        `You cannot use navigator.go() on the server because it is a stateless ` +
          `environment. This error was probably triggered when you did a ` +
          `\`navigate(${delta})\` somewhere in your app.`,
      );
    },
    back() {
      throw new Error(
        `You cannot use navigator.back() on the server because it is a stateless ` +
          `environment.`,
      );
    },
    forward() {
      throw new Error(
        `You cannot use navigator.forward() on the server because it is a stateless ` +
          `environment.`,
      );
    },
  };
}

type CreateStaticHandlerOptions = Omit<
  RouterCreateStaticHandlerOptions,
  "mapRouteProperties"
>;

/**
 * Create a static handler to perform server-side data loading
 *
 * @example
 * export async function handleRequest(request: Request) {
 *   let { query, dataRoutes } = createStaticHandler(routes);
 *   let context = await query(request);
 *
 *   if (context instanceof Response) {
 *     return context;
 *   }
 *
 *   let router = createStaticRouter(dataRoutes, context);
 *   return new Response(
 *     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
 *     { headers: { "Content-Type": "text/html" } }
 *   );
 * }
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes The {@link RouteObject | route objects} to create a static
 * handler for
 * @param opts Options
 * @param opts.basename The base URL for the static handler (default: `/`)
 * @param opts.future Future flags for the static handler
 * @returns A static handler that can be used to query data for the provided
 * routes
 */
export function createStaticHandler(
  routes: RouteObject[],
  opts?: CreateStaticHandlerOptions,
) {
  return routerCreateStaticHandler(routes, {
    ...opts,
    mapRouteProperties,
  });
}

/**
 * Create a static {@link DataRouter} for server-side rendering
 *
 * @example
 * export async function handleRequest(request: Request) {
 *   let { query, dataRoutes } = createStaticHandler(routes);
 *   let context = await query(request);
 *
 *   if (context instanceof Response) {
 *     return context;
 *   }
 *
 *   let router = createStaticRouter(dataRoutes, context);
 *   return new Response(
 *     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
 *     { headers: { "Content-Type": "text/html" } }
 *   );
 * }
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes The route objects to create a static {@link DataRouter} for
 * @param context The {@link StaticHandlerContext} returned from {@link StaticHandler}'s
 * `query`
 * @param opts Options
 * @param opts.future Future flags for the static {@link DataRouter}
 * @returns A static {@link DataRouter} that can be used to render the provided routes
 */
export function createStaticRouter(
  routes: RouteObject[],
  context: StaticHandlerContext,
  opts: {
    future?: Partial<FutureConfig>;
  } = {},
): DataRouter {
  let manifest: RouteManifest = {};
  let dataRoutes = convertRoutesToDataRoutes(
    routes,
    mapRouteProperties,
    undefined,
    manifest,
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
    get future() {
      return {
        middleware: false,
        ...opts?.future,
      };
    },
    get state() {
      return {
        historyAction: NavigationType.Pop,
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
    get window() {
      return undefined;
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
    patchRoutes() {
      throw msg("patchRoutes");
    },
    _internalFetchControllers: new Map(),
    _internalSetRoutes() {
      throw msg("_internalSetRoutes");
    },
    _internalSetStateDoNotUseOrYouWillBreakYourApp() {
      throw msg("_internalSetStateDoNotUseOrYouWillBreakYourApp");
    },
  };
}

function createHref(to: To) {
  return typeof to === "string" ? to : createPath(to);
}

function encodeLocation(to: To): Path {
  let href = typeof to === "string" ? to : createPath(to);
  // Treating this as a full URL will strip any trailing spaces so we need to
  // pre-encode them since they might be part of a matching splat param from
  // an ancestor route
  href = href.replace(/ $/, "%20");
  let encoded = ABSOLUTE_URL_REGEX.test(href)
    ? new URL(href)
    : new URL(href, "http://localhost");
  return {
    pathname: encoded.pathname,
    search: encoded.search,
    hash: encoded.hash,
  };
}

const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

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
